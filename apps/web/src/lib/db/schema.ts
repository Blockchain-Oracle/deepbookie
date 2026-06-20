import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

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
