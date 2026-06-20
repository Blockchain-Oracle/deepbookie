import { and, desc, eq } from 'drizzle-orm';
import { getDb } from './client';
import { chats, txOutcomes, type ChatRow, type TxOutcomeRow } from './schema';

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
}

/** A wallet's sessions, newest first. Wallet-scoped (isolation) — never returns another wallet's chats. */
export async function listChats(wallet: string): Promise<ChatSummary[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ id: chats.id, title: chats.title, updatedAt: chats.updatedAt })
    .from(chats)
    .where(eq(chats.walletAddress, wallet))
    .orderBy(desc(chats.updatedAt))
    .limit(60);
  return rows.map((r) => ({ id: r.id, title: r.title, updatedAt: r.updatedAt.toISOString() }));
}

/** One session — ownership-checked (must match the wallet) to prevent cross-wallet IDOR. */
export async function getChat(id: string, wallet: string): Promise<ChatRow | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, id), eq(chats.walletAddress, wallet)))
    .limit(1);
  return rows[0] ?? null;
}

/** Upsert the full transcript after each turn (called from the chat route's onFinish). */
export async function upsertChat(args: {
  id: string;
  wallet: string;
  title: string;
  messages: unknown;
}): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .insert(chats)
    .values({
      id: args.id,
      walletAddress: args.wallet,
      title: args.title.slice(0, 120),
      messages: args.messages as ChatRow['messages'],
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: chats.id,
      // Only the owning wallet may overwrite a session (no cross-wallet transcript clobber via a guessed id).
      set: { title: args.title.slice(0, 120), messages: args.messages as ChatRow['messages'], updatedAt: new Date() },
      setWhere: eq(chats.walletAddress, args.wallet),
    });
}

/**
 * Ensure a session row exists for (id, wallet) without touching an existing one. Lets the save-on-sign
 * path create a discoverable parent BEFORE the transcript's onFinish runs (fixes the "signed trade
 * orphaned when the tab closes" hole). No-ops if the id already belongs to another wallet.
 */
export async function ensureChat(id: string, wallet: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(chats).values({ id, walletAddress: wallet }).onConflictDoNothing({ target: chats.id });
}

/** Record a sign outcome the instant it happens (upsert by toolCallId) — the authoritative ledger. */
export async function recordOutcome(args: {
  toolCallId: string;
  chatId: string;
  wallet: string;
  toolName: string;
  status: 'signed' | 'cancelled' | 'failed';
  digest?: string | null;
}): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .insert(txOutcomes)
    .values({
      toolCallId: args.toolCallId,
      chatId: args.chatId,
      walletAddress: args.wallet,
      toolName: args.toolName,
      status: args.status,
      digest: args.digest ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: txOutcomes.toolCallId,
      // Only the wallet that first recorded this outcome may update it (no cross-wallet ledger poisoning).
      set: { status: args.status, digest: args.digest ?? null, updatedAt: new Date() },
      setWhere: eq(txOutcomes.walletAddress, args.wallet),
    });
}

/** A chat's sign outcomes (wallet-scoped) — overlaid onto the transcript on restore. */
export async function listOutcomes(chatId: string, wallet: string): Promise<TxOutcomeRow[]> {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(txOutcomes)
    .where(and(eq(txOutcomes.chatId, chatId), eq(txOutcomes.walletAddress, wallet)));
}
