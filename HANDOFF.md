# HANDOFF — DeepBook Predict Agent (2026-06-19)

Read this first, then `GOAL.md`, then the files in `research/`. This project was scoped in a conversation with Abu inside the sibling `onemem` session; it is now its own project. **Nothing here touches `onemem`** (that repo is a separate project run by another Claude Code session — never write to it).

---

## 1. Status
- **Goal + scope: LOCKED** (see `GOAL.md`). Do not re-open the "what are we building" question.
- **Exact tool/flow set: NOT yet decided** — the next conversation with Abu ("what we *truly* expose — we won't dump every tool").
- **Code: not started.** This folder holds the goal + research + handoff only. Build happens here as a new repo.
- **Two research passes done** (read-only, results in `research/`): (a) the DeepBook Predict / MCP-existence / pattern / track-fit decision brief; (b) modern MCP+CLI+skill+generative-UI references + stack — see `research/references-modern-stack.md` (summarized in §11 below).

## 2. The goal, plainly
An AI agent you *talk* to to trade DeepBook Predict (a Sui prediction market priced on a vol surface). The agent reads live odds, picks the right bet, shows the probability/payoff, and **you sign in your own wallet**. Delivered as **one tool registry → MCP + CLI + skill + a generative-UI web app + a landing page.**

## 3. The two-MCP / two-signer architecture (CORRECTED — two signing models, NOT "agent never signs")
- **Local (MCP / CLI / skill):** the agent **DOES sign** write ops — using a **managed local wallet auto-created on init** (install the MCP → it provisions one: a 12-word mnemonic in `~/.deepbook-predict/config.json` at `0o600`, the mnemonic is the user's backup, testnet default + faucet auto-fund, env override). Modern local-MCP pattern — verified in xlmtools / pacifica / portaldot (storage is plaintext-at-rest, only `0o600`). Better-than-env upgrades worth doing: **encrypt-at-rest keystore** (optional passphrase) + **sponsored tx via Enoki** (the local key never needs gas — the top Sui-native win). Full guide → `research/signing-history-voice.md`.
- **Web app:** the **user** signs with their **own browser extension wallet** (Sui dapp-kit `useDAppKit().signTransaction`); the agent is NOT in charge of signing there.
- Reconciliation (one contract across surfaces): **tool handlers build & return an UNSIGNED tx**; the LOCAL surface signs it with the managed local wallet, the WEB surface hands it to the user's extension wallet. One registry, signing pushed to the edge.

## 4. Why this is strong (from `research/synthesis.md`)
- **No DeepBook/Predict MCP exists** — confirmed-none across GitHub + the official MCP registry + Glama + pulsemcp, and none of the ~30 DeepBook Predict competitor repos is an MCP. **First-of-kind on two axes:** first Predict MCP, and **first Predict client at all** (`@mysten/deepbook-v3` v1.5.1 has *zero* `predict` references — spot+margin only; Predict writes must be hand-built PTBs).
- **User-signs is differentiated:** every precedent trading MCP (Polymarket, Kalshi, Hyperliquid, Jupiter, GMX) puts a **private key in an env var** and signs autonomously. "Agent proposes, user signs, agent holds no key" is shipped by nobody — and matches the track's framing.
- **Track fit:** satisfies the minimum (a sign card builds a real `predict::mint` PTB on testnet) and hits two idea-bank flavors (chat-based trading frontend + dev tooling that makes Predict legible).

## 5. The pattern (replicate / avoid)
- **REPLICATE — `portaldot-mcp`** (Abu's repo, cloned at `/tmp/portaldot-mcp`): one transport-free `allTools: ToolDef[]` registry → an MCP adapter (~31-line loop) AND a Vercel-AI adapter (same array) → typed structured returns → `tool-<name>` React cards. Read tools have `execute` (server → indexer); **write tools have NO `execute`** → streamed to client → confirm-and-sign card → wallet signs → `addToolResult` feeds the result back.
- **AVOID — `mpilot`** (Abu's abandoned repo): exploded the same idea into ~30 packages + a bespoke framework. **Flat array + thin adapters. No SDK-around-it.**
- `pacifica-mcp` (CLI + `SKILL.md` patterns) and `cdr-kit` (config DX) are secondary references. All cloned under `/tmp`.

## 6. DeepBook Predict — the protocol (from `research/predict-surface.md` + the README Abu pasted)
**Testnet targets (branch `predict-testnet-4-16`):**
- Predict package `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138`
- Predict object `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a`
- dUSDC quote `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` (6dp)
- Indexer `https://predict-server.testnet.mystenlabs.com` · Clock `0x6`
- **dUSDC faucet (request form): https://tally.so/r/Xx102L** · workshop video `https://youtu.be/8m3Q9My-qDo`
- Repo: `github.com/MystenLabs/deepbookv3` (branch `predict-testnet-4-16`, `packages/predict`). Use `@mysten/codegen` for PTB bindings (do NOT hand-roll BCS).

**Model:** `Predict` (shared protocol object: vault, pricing, oracle grids, PLP treasury) · `PredictManager` (per-user account; holds balances + positions/ranges as internal quantities, NOT NFTs) · `OracleSVI` (one market = one underlying + expiry; spot/forward/SVI/status/settlement) · `PLP` (LP share token).

**Write/sign tools (8 entrypoints — each returns an unsigned PTB):** `create_manager`, `mint`, `redeem`, `redeem_permissionless` (keeper-callable on settled), `mint_range`, `redeem_range`, `supply` (LP→PLP), `withdraw` (burn PLP). NOTE: `compact_settled_oracle` is admin/cap-gated — **not** a keeper action; only `redeem_permissionless` is open.

**Read tools (no signing):** on-chain getters (`get_trade_amounts` quote preview, `ask_bounds`, config) + the `predict-server` REST API (`/status`, `/predicts/:id/{state,oracles,vault/summary,vault/performance}`, `/oracles/:id/{state,prices,svi,ask-bounds}`, `/managers/:id/{summary,positions/summary,pnl}`, history endpoints). Known gaps: no `/openapi.json`, no `/leaderboard` (derive client-side); `/config` pricing/risk fields are null (read on-chain instead).

**GenUI data types:** Market (`OracleSVI` state), Vol-surface/odds (SVI params → `build_curve` → probability smile; UP = N(d2)), Position (`MarketKey`/`RangeKey` + PnL), PLP/vault state.

**End-to-end flow (tools compose):** create_manager → fund (acquire/deposit dUSDC) → read oracle state/odds → mint/mint_range → (settle) redeem/redeem_permissionless; LP path: supply → PLP → withdraw. The agent must sequence these (can't bet without a manager + dUSDC; checks odds before mint; checks vault depth before supply).

## 7. Generative-UI + user-signs mechanism (from `research/genui-and-fit.md`)
Use **AI SDK UI** (`useChat` + tool parts), **not** `streamUI`/RSC (RSC can't hold wallet state). Read tools get `execute`; write tools have NO `execute` → client renders a confirm-and-sign card → builds a `Transaction` with `tx.moveCall(...)` against the Predict package → **Sui dapp-kit `useSignAndExecuteTransaction`** (wallet pops, user approves) → feed digest back via `addToolResult`. (Confirm exact current API in `research/references-modern-stack.md`.)

## 8. The honest risk (do not ship the slop version)
"Chat over a swap" loses. The genUI widgets (vol-surface heatmap, range-payoff diagram, vault/PLP card, live PnL — all real, fed by the indexer + `build_curve`) must be the **primary** surface, and the agent must add **trading judgment** (NL → the right primitive: binary vs vertical range; show implied probability + breakeven; surface vault depth before a `supply`). Build the web app **deep**; let MCP/CLI/skill be the durability story.

## 9. Open / undecided (the next conversation with Abu)
1. **Exact tool/flow set for v1** — which of the 8 write tools + which read tools to expose for a clean trading flow (don't dump everything). Recommended starting subset: `create_manager`, `mint`, `mint_range`, `redeem`, `supply` (+ the matching read tools); `redeem_range`/`withdraw`/`redeem_permissionless` as stretch.
2. **Product name** (TBD — Abu names products).
3. **Repo scaffolding** + the modern stack to adopt (pending `research/references-modern-stack.md`).
4. Exact PTB arg/type-arg ordering per entrypoint — read `predict.move` + `scripts/transactions/predict` before wiring (the first build task).
5. dUSDC acquisition for the demo (faucet form above).
6. **Web-app history (Abu wants this)** — persistent conversation + generative-UI history: every transaction SIGNED and every one CANCELLED, plus the rendered genUI components re-shown from a Postgres store (the chat + DB pattern). Research → `research/signing-history-voice.md`.
7. **Voice + generative UI (Abu's stretch idea)** — voice in/out coordinated with the genUI so the voice PAUSES when a genUI component / sign card needs interaction or a signature, then resumes. Research → `research/signing-history-voice.md`.

## 10. Research artifacts (`research/`)
- `synthesis.md` — the decision brief (MCP existence, tool catalog, pattern, genUI, track fit, recommendation).
- `brief-mcp-existence.md` · `brief-predict-surface.md` · `brief-abu-repos-pattern.md` · `brief-genui-and-fit.md` — the deep briefs.
- `verify-*.md` — adversarial verifications.
- `references-modern-stack.md` — modern MCP/CLI/skill/genUI references + stack (added when the background run completes).
- External clones (ephemeral, /tmp): `deepbookv3-study` (branch `predict-testnet-4-16`), `ts-sdks-study`, `portaldot-mcp`, `pacifica-mcp`, `mpilot`, `cdr-kit`. Re-clone if gone.

## 11. Modern stack (references research — DONE; full guide: `research/references-modern-stack.md`)
- **Pattern to copy:** `coinbase/agentkit` (one action core → thin per-framework adapters) + `SylphxAI/tools` (neutral `defineTool` core + `-mcp`/`-vercel` adapter packages + per-tool `*.schema.ts`). `goat-sdk` = fan-out proof; `suiware/ai-tools` = closest Sui domain (but modernize its AI-SDK-v4 call sites); `cyanheads/git-mcp-server` = stdio+HTTP transport reference.
- **Stack (live versions 2026-06-19 — resolve with `pnpm add`, don't hardcode):** `ai@6` + `@ai-sdk/react@3` (NOT v7 beta, NOT RSC/`streamUI`), `@modelcontextprotocol/sdk@1.29` (stdio local + Streamable HTTP remote; NOT the deprecated SSE transport), `@mysten/sui@2.19`, `zod@4` (native `z.toJSONSchema()`).
- **Sui signing — IMPORTANT trap caught:** use the **NEW** `@mysten/dapp-kit-react` + `@mysten/dapp-kit-core` (`useDAppKit().signTransaction`), **NOT** the legacy `@mysten/dapp-kit` hooks (`useSignAndExecuteTransaction`) — Mysten marks them legacy/JSON-RPC-only, and they're exactly the "outdated-but-popular" trap most Sui tutorials still use.
- **genUI user-signs loop (current API):** write tools registered with **no `execute`** → client renders the sign card from the `tool-<name>` `input-available` part → `useDAppKit().signTransaction(unsignedTx)` → `addToolOutput({ output:{ digest } })` (NOT the old `addToolResult`). AI SDK 6 `needsApproval` is a valid newer alternative; omit-`execute` is the recommended primary.
- **The two-MCP resolved into two axes:** transport (stdio vs Streamable HTTP) × signing (local key vs browser wallet). The core tool **always returns an UNSIGNED tx; sign at the edge.** MVP: the web app **imports the registry in-process** — skip the network MCP hop + OAuth (reserve those only for a hosted MCP that third-party clients hit).
- Full deprecated-traps table (RSC/streamUI, `addToolResult`, `tool({parameters})`, SSE transport, legacy dapp-kit, MCP `2.0-alpha`, `ai@7`) is in the guide §4.

## 12. Signing, history & voice — decisions (research → `research/signing-history-voice.md`)
**Signing:**
- LOCAL = auto-provisioned keystore: on init, generate a 12-word mnemonic → `Ed25519Keypair.deriveKeypair` (`@mysten/sui`), persist the mnemonic to `~/.deepbook-predict/config.json` (`0o600`), **testnet default + faucet auto-fund**, env override. The mnemonic is the user's backup. Agent signs writes in-process. Clone `portaldot-mcp`'s `packages/core` signer + `tools/transfer.ts`; testnet auto-fund from `xlmtools wallet.ts:33-86`. (Storage is plaintext-at-rest in all the references — only `0o600`.)
- **Sui-native upgrades:** (1) encrypt the keystore at rest (optional passphrase — strictly better than every reference); (2) **sponsored transactions via Enoki** so the local key never needs gas (highest-leverage Sui win; what a sponsor wants to see).
- WEB = user signs via the **new** `@mysten/dapp-kit-react` `useDAppKit().signTransaction` (NOT legacy `@mysten/dapp-kit` `useSignAndExecuteTransaction` — §11's currency check overrides the signing-history-voice synthesis, which names the legacy hook). zkLogin/Enoki = web onboarding upgrade only.

**GenUI history:** persist the whole `UIMessage.parts[]` as one `json` column (the `Message_v2` shape from `vercel/ai-chatbot`); restore via `useChat({ messages })` — the same components re-render. Signed/cancelled = a **separate `transaction` table keyed by `toolCallId` (UNIQUE)**, statuses `proposed → signed | cancelled | failed` (+ Sui digest), patched client-side after the wallet result. **Never mutate the `parts` blob post-hoc.** Custom data parts persist only if given a stable `id` (transient otherwise).

**Voice + genUI — STRETCH, not v1.** v1 headline = genUI + tool-calling in the text/chat path (sign card via dapp-kit). Voice layers on the SAME registry later: the pause-for-signature is a client tool whose handler `await`s the card's confirm/cancel (the wallet modal is already blocking). Cleanest: **ElevenLabs Conversational AI** (wait-for-response client tools = the pause primitive for free) or **OpenAI Agents SDK `RealtimeAgent` + `needsApproval`** (single provider). Spike before committing; don't make the demo depend on voice.

**Open for Abu:** (1) depend on Enoki for sponsored tx?; (2) voice provider (ElevenLabs vs OpenAI Agents); (3) keystore encryption in v1 or later.

## 13. Resume prompt (for a fresh Claude Code instance in this folder)
> Read `HANDOFF.md`, `GOAL.md`, and `research/`. The goal + scope are LOCKED — do not re-litigate. We're building a DeepBook Predict AI-agent: one tool registry → MCP + CLI + skill + a generative-UI web app (the headline) + landing, user signs in their own wallet (agent holds no key), portaldot pattern (not an SDK). First, with Abu, decide the exact tool/flow set for v1 (don't dump every tool). Then scaffold a NEW repo here using the modern stack in `research/references-modern-stack.md`, and the FIRST build task is nailing the PTB arg ordering per Predict entrypoint from `predict.move` + `scripts/transactions/predict`. Build on Predict testnet (constants in §6). Verify for real on testnet per feature — never batch testing to the end. PR discipline + the pr-review toolkit before merge.
