I now have complete, version-verified coverage across all four sub-questions. Let me compile the deliverable.

## Scope
Persistent chat + generative-UI history for a Vercel AI SDK **v6** + Postgres app: (a) how the SDK persists/restores `message.parts` including tool/genUI parts; (b) a concrete Drizzle Postgres schema; (c) recording SIGNED vs CANCELLED transactions linked to a message/toolCallId; (d) how restoration re-renders genUI components. Targeted at the DeepBook Predict web app where the **user signs in their browser wallet** (dapp-kit) and genUI is the headline.

## Sources Checked
- **npm versions** (`npm view`, run 2026-06-19): `ai@6.0.208` (latest), `ai-v6` dist-tag = `6.0.132`, `@ai-sdk/react@3.0.210`, `drizzle-orm@0.45.2`.
- **vercel/ai-chatbot** (canonical template, `main`, fetched to `/tmp/ai-chatbot-schema/`): `lib/db/schema.ts` (verbatim, 3759 bytes), `lib/db/queries.ts` (`saveMessages`/`getMessagesByChatId`/`updateMessage`, lines 240-275), `app/(chat)/api/chat/route.ts` (onFinish persistence wiring).
- **ai-sdk.dev docs**: `ai-sdk-ui/chatbot-message-persistence` (via WebFetch). Note: `ai-sdk-ui/message-persistence` returned 404 — current slug is **chatbot-message-persistence**.
- **Context7 `/vercel/ai`**: chatbot-message-persistence.mdx, chatbot-tool-usage.mdx, streaming-data.mdx, migration-guide-5-0.mdx, render-visual-interface-in-chat cookbook, common-errors skill.

## Verified Facts

### (a) How the SDK persists & restores `message.parts` (incl. tool/genUI parts)

**The unit of persistence is the `UIMessage`, stored whole.** A `UIMessage` = `{ id, role, parts[], ... }`. Since AI SDK 4.2 (and unchanged through v6), the ordered `parts` array replaced the old flat fields and is the single source of truth for rendering — it holds `text`, `reasoning`, **typed tool parts**, **dynamic-tool parts**, and **custom data parts** in render order (migration-guide-5-0.mdx; common-errors.md). You persist the array as-is and re-render from it; **no separate "tool invocation" reconstruction is needed.**

**Tool parts naming & states (v5/v6):**
- Static tools serialize as `type: "tool-<toolName>"` (e.g. `tool-getWeatherInformation`); dynamic/runtime tools as `type: "dynamic-tool"` with a `toolName` field.
- Each tool part carries `toolCallId`, `state`, and state-dependent `input`/`output`/`errorText`. The four states: `input-streaming` → `input-available` → `output-available` / `output-error` (chatbot-tool-usage.mdx; migration-guide-5-0.mdx). **This `toolCallId` + persisted `output` is exactly what you key transaction history to (part c).**
- Catch-all helper: `isToolUIPart(part)` from `ai` (common-errors.md).

**Persistence trigger — `onFinish`/`onEnd` on the stream.** In v6 the callback is on `toUIMessageStream(...)` (or `toUIMessageStreamResponse`). It receives the fully-reconciled `messages: UIMessage[]` (the assistant message with all its tool parts and outputs already merged) and you write them to Postgres there. `onFinish` is now a **deprecated alias for `onEnd`** (stream-text.mdx reference) — prefer `onEnd`. Pass `originalMessages` so the callback returns the complete updated array.

**Server-generated IDs:** use `createIdGenerator({ prefix: 'msg', size: 16 })` as `generateMessageId` (or write a `start` chunk with `messageId: generateId()`) so persisted assistant IDs are stable and don't collide with client IDs.

**Restore on load:** `loadChat(id)` → `UIMessage[]` → pass as `useChat({ id, messages: initialMessages, transport })`. Before feeding loaded history back to the model, run `validateUIMessages({ messages, tools, dataPartsSchema, metadataSchema })` to guard against schema drift; on `TypeValidationError` you can fall back to `[]`. (chatbot-message-persistence.mdx).

**Bandwidth optimization:** `DefaultChatTransport`'s `prepareSendMessagesRequest` sends only `messages[messages.length-1]`; the server reloads prior history and appends (`const messages = [...previousMessages, message]`).

**Custom data parts (fully custom genUI, not tool-shaped):** stream with `writer.write({ type: 'data-<name>', id, data })` on a `createUIMessageStream`. **Critical persistence rule:** a data part **with an `id` is persistent → added to `message.parts`** and re-rendered from history; **without an `id` it is transient** → delivered only via `useChat`'s `onData` callback and NOT saved. Reusing the same `id` reconciles/updates the existing part (loading→success). Use `transient: true` for ephemeral toasts (streaming-data.mdx; langchain README). For DeepBook: an order-preview card streamed as `data-orderPreview` with a stable `id` persists and re-renders; a "submitting…" toast should be transient.

### (b) Concrete Drizzle Postgres schema (canonical `vercel/ai-chatbot`, verbatim)

The template stores **all parts in one `json` column** — this is the recommended pattern (`/tmp/ai-chatbot-schema/schema.ts`):

```ts
export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId").notNull().references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] }).notNull().default("private"),
});

export const message = pgTable("Message_v2", {       // "_v2" = current; old "Message" deprecated
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),                    // <- entire UIMessage.parts[] incl. tool/genUI parts
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});
export type DBMessage = InferSelectModel<typeof message>;
```
Plus `user`, `vote` (`Vote_v2`, composite PK `[chatId, messageId]`), `stream` (resumable-stream support), `document`/`suggestion` (artifacts — drop for DeepBook). **Key design decision:** parts are NOT normalized into a separate `message_parts` table — they live in the `parts` json blob. The `Message_v2`/`Vote_v2` suffix is the template's migration story: the original `Message` table (flat `content`) was deprecated in favor of `_v2` with the `parts` array. **For the DeepBook app, start at `Message_v2` shape — there is no v1 to carry.**

**Save (queries.ts:240) / Load (queries.ts:262):**
```ts
export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  return await db.insert(message).values(messages);
}
export async function getMessagesByChatId({ id }) {
  return await db.select().from(message).where(eq(message.chatId, id)).orderBy(asc(message.createdAt));
}
```

**Persistence wiring** (route `onFinish`, maps UIMessage→DBMessage):
```ts
await saveMessages({
  messages: finishedMessages.map((m) => ({
    id: m.id, role: m.role, parts: m.parts,
    createdAt: new Date(), attachments: [], chatId: id,
  })),
});
```
(The template also has a tool-approval branch that uses `updateMessage({ id, parts })` to overwrite a message's parts in place — relevant if you add human-in-the-loop tx approval.)

### (c) Recording SIGNED vs CANCELLED transactions (linked to message + toolCallId)

The `parts` blob already records the tool *result* (the unsigned tx), but **signed-vs-cancelled is a wallet/user outcome that happens client-side after the stream finishes** — so it needs its own table keyed by `toolCallId` (the stable join key from the tool part). Add a sibling table to the canonical schema:

```ts
export const transaction = pgTable("Transaction", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id),
  messageId: uuid("messageId").notNull().references(() => message.id),
  toolCallId: text("toolCallId").notNull(),          // == tool part.toolCallId  (UNIQUE)
  kind: varchar("kind").notNull(),                   // e.g. "place_limit_order", "cancel_order"
  // outcome lifecycle:
  status: varchar("status", {
    enum: ["proposed", "signed", "cancelled", "failed"],
  }).notNull().default("proposed"),
  digest: text("digest"),                            // Sui tx digest once signed/executed (null if cancelled)
  unsignedTx: json("unsignedTx"),                    // the tx bytes the tool produced
  effects: json("effects"),                          // execution effects / error
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  resolvedAt: timestamp("resolvedAt"),               // when user signed or cancelled
}, (t) => ({ toolCallUnique: unique().on(t.toolCallId) }));
```

**Flow (web, user signs in browser):**
1. Tool runs server-side → produces unsigned tx → part reaches `output-available` with `toolCallId`. On `onFinish`, insert a `transaction` row `status: "proposed"`, `unsignedTx`, linked by `messageId` + `toolCallId`.
2. The genUI tx-card (rendered from the tool part) calls dapp-kit `signAndExecuteTransaction`. On success → `PATCH /api/tx/:toolCallId { status:"signed", digest, effects, resolvedAt }`; on user reject → `{ status:"cancelled", resolvedAt }`; on chain failure → `"failed"`.
3. The card reads its own status by `toolCallId` (server component query, or include status in the persisted data part). On history reload, you `getMessagesByChatId` for parts AND `getTransactionsByChatId` for outcomes, and the card shows "Signed ✓ (digest)" / "Cancelled" instead of live buttons.

**Why a separate table, not the json blob:** the outcome is mutated *after* the message is immutably persisted, you want to query "all signed/cancelled txs for this user" across chats, and `toolCallId UNIQUE` gives idempotent upserts from the wallet callback. (`messageId`→`message.id` and `toolCallId`→the tool part are the two join keys the SDK guarantees are stable.)

### (d) How restoration re-renders genUI components

Restoration is **just re-running the same `parts.map` render switch** the live stream uses — there is no separate "history renderer." `useChat({ messages: loadedMessages })` seeds the loaded array; React renders each message's `parts` identically to live (render-visual-interface-in-chat cookbook; chatbot-tool-usage.mdx):

```tsx
{message.parts.map((part, i) => {
  switch (part.type) {
    case 'text':       return <Markdown key={i}>{part.text}</Markdown>;
    case 'reasoning':  return <Reasoning key={i} text={part.text} />;
    case 'tool-placeLimitOrder':
      // state survives in the persisted part:
      if (part.state === 'output-available')
        return <OrderCard key={part.toolCallId} order={part.output} toolCallId={part.toolCallId} />;
      if (part.state === 'output-error')
        return <ErrorCard key={part.toolCallId} text={part.errorText} />;
      return <OrderSkeleton key={part.toolCallId} input={part.input} />;
    case 'data-orderPreview':            // custom genUI persisted via id
      return <OrderPreview key={part.id} {...part.data} />;
    default:
      if (isToolUIPart(part)) return <GenericTool key={part.toolCallId} part={part} />;
  }
})}
```
Because the persisted part already contains `state: "output-available"` + the `output` payload (and `toolCallId`), the **exact same component re-mounts with the same props** — the generative-UI card reappears verbatim. For the DeepBook tx-card, join the persisted `toolCallId` against the `transaction` table to swap live sign/cancel buttons for the recorded SIGNED/CANCELLED outcome.

## Inferences
- The `transaction` table (part c) is my design extrapolation; `vercel/ai-chatbot` ships no tx table (it's not a wallet app). It follows the template's `Vote_v2` precedent (an outcome table keyed to a message). High confidence on the join keys (`messageId`, `toolCallId`) because those are SDK-guaranteed-stable; medium confidence on exact column set — tune to your DeepBook tool shapes.
- Web user-signs flow: I'm pairing the SDK persistence model with dapp-kit `signAndExecuteTransaction` from the task context. The signed/cancelled write-back is a normal REST `PATCH` you implement; the SDK doesn't own post-stream wallet outcomes.
- Recommendation: keep `parts` as the immutable conversation record; keep mutable tx outcomes in the relational `transaction` table. Don't try to mutate the `parts` blob on sign/cancel (it's already persisted and the SDK may overwrite it on `updateMessage`).

## Unknowns And Questions
- **`json` vs `jsonb`:** the template uses Drizzle `json()` (text-backed). For querying inside parts (e.g. "find all messages containing a placeLimitOrder tool part") prefer `jsonb()` + a GIN index. The template doesn't query into `parts`, so it uses `json`; for tx analytics you may want `jsonb`. Not yet verified which the DeepBook app needs — depends on whether you query parts or rely solely on the `transaction` table (the latter is cleaner).
- **v6.0.208 vs ai-v6 dist-tag 6.0.132:** `latest` is ahead of the `ai-v6` tag. Confirm which you'll pin. The persistence API (`toUIMessageStream`, `onEnd`, typed tool parts, `validateUIMessages`, data-part `id` rule) is stable across both; no breaking change observed in the docs between them.
- **Exact current render-component path in the template:** `components/message.tsx` 404'd (file was renamed/moved on `main`); the render pattern above is from Context7's official cookbook/docs, which is the authoritative rendering pattern regardless of the template's file layout.
- **resumable streams:** the `Stream` table + `consumeStream()` support reconnect mid-generation. Worth adding if a tx-generating turn is long, but orthogonal to history persistence — flag if you want that researched.

Key artifacts saved at `/tmp/ai-chatbot-schema/schema.ts` and `/tmp/ai-chatbot-schema/queries.ts`.