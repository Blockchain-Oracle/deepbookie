These three briefs are already verified and dense. My job is to merge them into one concise build guide. No new research needed — I'll synthesize what's been validated and add decisive recommendations.

# DeepBook Predict Agent — Build Guide (Signing · GenUI History · Voice)

## Scope
One shared tool registry feeds a local MCP + CLI + skill + a generative-UI web app (Vercel AI SDK v6). Tools build txs. Two distinct signers: LOCAL (agent signs with an auto-provisioned managed wallet) and WEB (user signs in a browser extension via Sui dapp-kit). Web genUI is the headline. This guide covers the corrected two-signer model, genUI persistence + Postgres schema, and voice+genUI coordination.

---

## 1) Two-signer model (CORRECTED)

### LOCAL — agent signs with an auto-provisioned keystore
The pattern shipped by the reference repos (`xlmtools`, `pacifica-mcp`, `portaldot-mcp`) is **auto-create-on-init + `0o600` local file + env override + testnet-default**. All three use one `loadOrCreateWallet`/`getSigner` that checks an env override → loads `~/.<tool>/config.json` → else generates a fresh key and writes `0o600`, triggered once at server/CLI startup.

| Repo | Key type | Store path | Stored material | Cite |
|---|---|---|---|---|
| xlmtools | Stellar Ed25519 | `~/.xlmtools/config.json` | raw secret seed | `wallet.ts:14-15, 88-101` |
| pacifica | Solana Ed25519 | `~/.pacifica-mcp/config.json` | base58 64-byte secret | `wallet.ts:8-9, 43-56` |
| portaldot | sr25519 | `~/.portaldot-mcp/config.json` | **12-word BIP39 mnemonic** | `chain/wallet.ts:10-11, 40-43` |

**CORRECTION to internalize — "social recovery" does NOT exist in xlmtools or pacifica.** Verified by grep across all `src/` and docs. What actually ships is: (a) a **BIP39 mnemonic backup** (portaldot only — `tools/utils.ts:12, 16-18` returns it with "store it safely"), and (b) **re-import into a real wallet** (pacifica's recovery story = copy key into Phantom/Backpack, `wallet.ts:66-71`). Storage is **plaintext at rest** everywhere; the only protection is `0o600`. There are no guardians, no threshold, no recovery contract. In crypto today, social recovery lives in smart-contract accounts (Argent/Safe/Sui multisig), not in agent keystores. **Do not write "social recovery" into the spec — call it an "auto-provisioned local keystore with mnemonic backup," or you over-promise a feature none of the references implement.**

**Local signing is in-process, no human approval** — the point of the headless MCP. Each write tool reloads the wallet, rebuilds the keypair, signs, submits (pacifica `tools/market-order.ts:37-51`; portaldot `tools/transfer.ts:19-27`).

**Reference to clone: `portaldot-mcp`** — it is the only one that (a) stores a recoverable mnemonic, (b) cleanly splits `packages/core` (headless signer) from `packages/web` (extension signer), and (c) already pairs with AI SDK v5 genUI. That is exactly the DeepBook shape.

**Recommended LOCAL design for Sui, in priority order:**
1. **Baseline (ship):** on init, `Ed25519Keypair.deriveKeypair(mnemonic)` from a 12-word mnemonic (`@mysten/sui/keypairs/ed25519`); persist the **mnemonic** to `~/.deepbook-predict/config.json` at `0o600`; print address; **default to testnet**; auto-request testnet gas from the faucet (mirror xlmtools' friendbot auto-fund, `wallet.ts:33-86`). Keep a `*_MNEMONIC`/`*_PRIVATE_KEY` env override for CI/power users.
2. **One concrete upgrade over the references — encrypt at rest:** optional passphrase keystore (scrypt/argon2 + XChaCha20/AES-GCM, decrypt into memory on init). Strictly better than env and than all three repos.
3. **The Sui-native "even better" move — sponsored transactions:** use **Enoki** (or self-hosted `sui-gas-station`) to sponsor gas so the auto-created local key only **signs** and never needs to **hold SUI**. This kills the #1 friction of the local-key pattern (fresh wallet with no gas can't transact) and is what a Sui sponsor expects to see.

### WEB — user signs via extension wallet (Sui dapp-kit)
portaldot makes the split explicit: `CLAUDE.md:5` "Browser injected-wallet signing; the server never holds keys"; `web/lib/polkadot.ts:22-35` signs with `injector.signer` from the extension; `skill.md:85` "in the web app the user signs each write in their browser wallet … the server holds no keys." **Sui equivalent = `@mysten/dapp-kit` `useSignAndExecuteTransaction` + browser wallet.** Tools build the tx; the user's extension signs.

**Better-than-env options worth a spike:** **zkLogin / Enoki** for *web* onboarding (self-custodial address from OAuth, no seed phrase) — but it is a poor fit for the *headless* local MCP (needs interactive OAuth + ZK proof). So: keep **zkLogin/Enoki on web, mnemonic keystore on local**. For real "social recovery," express it as a **Sui native multisig (k-of-n)**, not a hand-rolled guardian contract. **Avoid for the hackathon:** MPC/passkey signing for the *local* key (passkeys are a browser primitive, not a Node-CLI one; note WebAuthn as the future web direction, but extension+dapp-kit is the correct hackathon choice today).

---

## 2) GenUI history — persistence + Postgres schema (Vercel AI SDK v6)

**Versions (npm view 2026-06-19):** `ai@6.0.208` (latest; `ai-v6` dist-tag = `6.0.132`), `@ai-sdk/react@3.0.210`, `drizzle-orm@0.45.2`. Persistence API is stable across both `ai` pins.

**The unit of persistence is the whole `UIMessage`; its ordered `parts[]` is the single source of truth** (since 4.2, unchanged through v6). `parts` holds `text`, `reasoning`, **typed tool parts** (`type: "tool-<name>"`, or `dynamic-tool` with a `toolName`), and **custom data parts**. Each tool part carries `toolCallId` + `state` (`input-streaming → input-available → output-available | output-error`) + `input`/`output`/`errorText`. You persist the array as-is and re-render from it — no "tool invocation" reconstruction.

- **Persist in `onEnd`** of `toUIMessageStream(...)` (`onFinish` is now a deprecated alias). Pass `originalMessages` so you get the full updated array. Use `createIdGenerator({ prefix:'msg', size:16 })` for stable server IDs.
- **Restore:** `loadChat(id) → UIMessage[] → useChat({ id, messages, transport })`. Run `validateUIMessages({ messages, tools, dataPartsSchema })` to guard schema drift; fall back to `[]` on `TypeValidationError`.
- **Custom data parts persistence rule (critical):** `writer.write({ type:'data-<name>', id, data })` **with an `id` → persisted to `message.parts`** and re-rendered from history; **without an `id` → transient** (delivered via `useChat` `onData`, NOT saved). Same `id` reconciles/updates in place. For DeepBook: order-preview card = `data-orderPreview` with stable `id` (persists); "submitting…" toast = transient.

**Schema (canonical `vercel/ai-chatbot`, verbatim — all parts in ONE `json` column, not normalized):**

```ts
export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),          // entire UIMessage.parts[] incl. tool/genUI parts
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});
```
Start at the `Message_v2` shape (the `_v2` suffix is the template's own migration off a deprecated flat-`content` table — there's no v1 to carry). `chat` table holds `id/title/userId/visibility`. Save = `db.insert(message).values(...)`; load = `select … where chatId order by createdAt asc` (`queries.ts:240, 262`).

**Signed vs cancelled tx — separate table keyed by `toolCallId`.** The unsigned tx lives in the `parts` blob, but signed/cancelled is a **wallet outcome that happens client-side after the stream finishes**, so it needs its own mutable, queryable table (mirrors the template's `Vote_v2` outcome-table precedent):

```ts
export const transaction = pgTable("Transaction", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chatId").notNull().references(() => chat.id),
  messageId: uuid("messageId").notNull().references(() => message.id),
  toolCallId: text("toolCallId").notNull(),                  // == tool part.toolCallId (UNIQUE)
  kind: varchar("kind").notNull(),                           // "place_limit_order" | "cancel_order" ...
  status: varchar("status", { enum:["proposed","signed","cancelled","failed"] }).notNull().default("proposed"),
  digest: text("digest"),                                    // Sui tx digest once signed
  unsignedTx: json("unsignedTx"),
  effects: json("effects"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  resolvedAt: timestamp("resolvedAt"),
}, (t) => ({ toolCallUnique: unique().on(t.toolCallId) }));
```
**Flow:** on `onEnd`, insert `status:"proposed"` linked by `messageId`+`toolCallId` → genUI card calls dapp-kit `signAndExecuteTransaction` → on success `PATCH /api/tx/:toolCallId {status:"signed", digest, effects, resolvedAt}`; on reject `{status:"cancelled"}`; on chain failure `"failed"`. `toolCallId UNIQUE` gives idempotent upserts. **Don't mutate the `parts` blob on sign/cancel** — it's immutable and `updateMessage` may overwrite it.

**Restoration re-renders identically — there is no separate history renderer.** `useChat({ messages: loaded })` seeds the array; React runs the same `parts.map` switch as live. Because the persisted part already carries `state:"output-available"` + `output` + `toolCallId`, the exact same component re-mounts with the same props:
```tsx
case 'tool-placeLimitOrder':
  if (part.state === 'output-available')
    return <OrderCard key={part.toolCallId} order={part.output} toolCallId={part.toolCallId} />;
```
On reload, join `getMessagesByChatId` (parts) with `getTransactionsByChatId` (outcomes): the card swaps live sign/cancel buttons for "Signed ✓ (digest)" / "Cancelled".

**Note:** template uses `json()`; if you later query *inside* parts, switch to `jsonb()` + GIN. Cleaner to query the relational `transaction` table and keep `parts` opaque.

---

## 3) Voice + genUI

**Versions (npm view 2026-06-19):** `@elevenlabs/react@1.7.0`, `@elevenlabs/client@1.12.0`, `@openai/agents-realtime@0.11.8`, `ai@6.0.208`, `@mysten/dapp-kit@1.1.1`.

**The convergent coordination pattern: a client/frontend tool whose handler returns a Promise you don't resolve until the user finishes the UI interaction.**
1. Agent calls a client tool, e.g. `placePrediction({market, side, size})`.
2. Handler (a) pauses voice, (b) renders the confirm-and-sign card.
3. Handler `await`s a Promise resolved by the card's `onConfirm`/`onCancel`. The wallet signature is already promise-based — dapp-kit `useSignAndExecuteTransaction` resolves on extension approval. So the handler effectively does `const r = await signAndExecute(tx)`.
4. Return digest (or "rejected"); agent appends to context and resumes speaking.

**How each option does the pause:**
- **ElevenLabs Conversational AI** — **client tools with "Wait for response" = on**; async handlers are first-class and the agent waits for the return value. **This is the only option where "agent waits for a frontend tool's async return" is a documented feature** — i.e. the pause-for-signature primitive comes for free. React: `useConversation` / `useConversationClientTool(name, handler)` (auto-cleanup). Ships ElevenLabs UI (shadcn Orb/waveform/Conversation Bar) for chrome.
- **OpenAI Agents SDK `RealtimeAgent`** (`@openai/agents-realtime`) — define the sign tool with `needsApproval:true`; the run pauses with `tool_approval_requested`, returns `result.interruptions`, you render the card and `result.state.approve()/reject()` then resume; the SDK serializes state across the gap. `session.mute(true)` toggles capture (note: `OpenAIRealtimeWebSocket` can't mute — pause `sendAudio()` yourself; WebRTC can).
- **OpenAI Realtime API (raw)** — function call arrives in `response.done`; you execute, send `function_call_output`, then `response.create`. Stop speech with `response.cancel` + `conversation.item.truncate`. Most plumbing.
- **Vercel AI SDK** — strongest at genUI + tool-calling in the **text** path, but ships **no real-time speech-to-speech loop** (only `experimental_transcribe`/`generateSpeech` + Voice Elements UI). You'd assemble the voice loop yourself around its STT/TTS.
- **Pipecat** — most control, self-hosted, heaviest hackathon lift.

**Difficulty: MEDIUM, lower than expected — because the wallet must be signed in the browser.** The hard part of voice+genUI is making the model yield to the UI; a wallet signature is the *ideal* interaction because the extension already imposes a synchronous, promise-based, user-blocking modal. The fiddly bits: (1) don't talk over the modal (handled by wait-for-tool-response + mute), (2) handle reject/timeout gracefully (return "rejected" so the agent recovers verbally), (3) barge-in/echo (solved inside the managed agents — mute the mic while the extension is focused).

**Cleanest approach:** **ElevenLabs Conversational AI** for voice with client tools (Wait-for-response on); read-only/quote tools render genUI cards; the write/sign tool handler renders the confirm-and-sign card and `await`s dapp-kit `useSignAndExecuteTransaction`. If you want one provider / tighter traces, **OpenAI Agents SDK `RealtimeAgent` + `needsApproval:true`** is the purpose-built equivalent. Either way **voice is just one more consumer of the same shared tool registry** calling the same tool and rendering the same card.

---

## Recommendations
1. **Clone `portaldot-mcp`'s architecture** (`packages/core` headless signer + `packages/web` extension signer + AI SDK genUI). Port the signer to Sui: mnemonic keystore at `~/.deepbook-predict/config.json`, `0o600`, **testnet default + faucet auto-fund on init**, env override escape hatch. Copy-from files: local signer → `portaldot .../chain/wallet.ts`; signed-write tool → `.../tools/transfer.ts`; web extension signer → `.../web/lib/polkadot.ts`; testnet auto-fund → `xlmtools .../wallet.ts:33-86`.
2. **Stop calling it "social recovery."** Spec it as "auto-provisioned local keystore with mnemonic backup." If Abu genuinely wants social recovery, build it as a **Sui native multisig**, and treat it as a headline differentiator with its own scope — not a free byproduct of the keystore.
3. **Adopt Sui-native sponsored transactions (Enoki) early** so the local agent key never needs gas. This is the single highest-leverage Sui-specific upgrade and directly answers what a Sui sponsor wants to see.
4. **Web signing = `@mysten/dapp-kit` `useSignAndExecuteTransaction`.** Keep zkLogin/Enoki as the *web* onboarding upgrade only.
5. **Persistence: one `parts` json column** (`Message_v2` shape) + a **separate `transaction` table keyed by `toolCallId UNIQUE`** for signed/cancelled outcomes. Persist in `onEnd`; restore via `useChat({messages})` + `validateUIMessages`; never mutate `parts` post-hoc.
6. **Encrypt the local keystore at rest** (optional passphrase) — cheap, strictly better than every reference and than env.
7. **Voice = stretch, not a v1 trade dependency.** v1 headline = genUI + tool-calling in the **text/chat path** (Vercel AI SDK, sign card via dapp-kit) — fully controllable, demo-winning. Voice layers on the same registry: (i) voice for read-only queries/quotes, (ii) voice-initiated trade that routes into the *same* click-driven confirm-and-sign card. Keep the canonical sign flow click-driven; let voice feed into it.
8. **Voice provider pick: ElevenLabs Conversational AI** for the wait-for-signature primitive out of the box; fall back to **OpenAI Agents SDK `RealtimeAgent` + `needsApproval`** if Abu wants a single provider with built-in traces.

## Open points for Abu
1. **"Social recovery" wording** — confirm you meant the auto-create-local-wallet pattern (real) / mnemonic backup (real, self-custody) and NOT guardian-based recovery. If you truly want guardians → that's new work = a Sui multisig/smart-account, potentially the headline.
2. **Sponsored tx** — OK to depend on **Enoki** (hosted; pricing/rate-limits unchecked for hackathon) vs self-hosting `sui-gas-station` as fallback?
3. **`ai` pin** — `latest 6.0.208` vs `ai-v6` dist-tag `6.0.132`? Persistence API is identical across both; pick one.
4. **`json` vs `jsonb`** for `parts` — `json` (template default) is fine if you only query the relational `transaction` table; choose `jsonb`+GIN only if you'll query inside parts.
5. **Voice provider = single-provider (OpenAI Agents SDK end-to-end) or mixed (ElevenLabs voice + AI SDK genUI)?** Product decision. Affects two spike items: **ElevenLabs client-tool response timeout** for a slow human signature (undocumented max — needs a /tmp spike), and **`RealtimeAgent`+`needsApproval` realtime ergonomics** mid-conversation (less documented than the non-realtime runner — spike before committing).
6. **Local keystore encryption** — ship the optional passphrase in v1, or defer post-hackathon?