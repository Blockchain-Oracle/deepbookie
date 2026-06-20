import { and, desc, eq } from 'drizzle-orm';
import { getDb } from './client';
import { chats, type ChatRow } from './schema';

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
      set: { title: args.title.slice(0, 120), messages: args.messages as ChatRow['messages'], updatedAt: new Date() },
    });
}
