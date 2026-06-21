import { index, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Chat sessions = History. One row per conversation, keyed by wallet. `messages` is the full
 * UIMessage[] transcript (jsonb) — the immutable record we replay; signed receipts persist inside it.
 * No trades table: positions live on-chain (History is the conversation, not the ledger).
 */
export const chats = pgTable(
  'chats',
  {
    id: text('id').primaryKey(), // client-generated session id (uuid)
    walletAddress: text('wallet_address').notNull(),
    title: text('title').notNull().default('New chat'),
    messages: jsonb('messages').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('chats_wallet_idx').on(t.walletAddress, t.updatedAt)],
);

export type ChatRow = typeof chats.$inferSelect;

/**
 * Sign outcomes, keyed by the tool call (UNIQUE). Written the instant the user signs/declines —
 * independent of the chat transcript — so a signed trade is recorded even if the stream never
 * resumes (tab closed). The transcript stays the conversation record; this is the authoritative
 * ledger of what was actually signed. On restore we overlay these onto the receipts.
 */
export const txOutcomes = pgTable(
  'tx_outcomes',
  {
    toolCallId: text('tool_call_id').primaryKey(),
    chatId: text('chat_id').notNull(),
    walletAddress: text('wallet_address').notNull(),
    toolName: text('tool_name').notNull(),
    status: text('status').notNull(), // 'signed' | 'cancelled' | 'failed'
    digest: text('digest'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tx_outcomes_chat_idx').on(t.chatId)],
);

export type TxOutcomeRow = typeof txOutcomes.$inferSelect;

/**
 * Captured manager ids (owner → id), keyed by (wallet, kind). Both the PredictManager and the DeepBook
 * BalanceManager are SHARED objects: the on-chain resolver can't see a BalanceManager at all, and the
 * Predict indexer lags ~7s after creation — so resolving by owner can transiently return null and make
 * the agent nag "create one" (→ a duplicate that orphans funds). We capture the id at creation here so
 * resolution is instant + durable across sessions/devices, with the indexer/tx-scan as fallback.
 */
export const managers = pgTable(
  'managers',
  {
    walletAddress: text('wallet_address').notNull(),
    kind: text('kind').notNull(), // 'predict' | 'balance'
    managerId: text('manager_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.walletAddress, t.kind] })],
);

export type ManagerRow = typeof managers.$inferSelect;
export type ManagerKind = 'predict' | 'balance';
