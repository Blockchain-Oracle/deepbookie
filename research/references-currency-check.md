All key claims now verified against primary sources. I have everything needed including the resolution of the previously-flagged dapp-kit unknown, plus a correction on portaldot's chain. Synthesizing.

## Scope

Adversarial currency re-check of the three briefs (GENUI, MCP, REFERENCES) for the DeepBook Predict agent product. Independently re-verified, as of 2026-06-19, the latest published versions and whether each named pattern is the CURRENT recommended approach or an OUTDATED-but-popular trap. Verdict per key claim: CONFIRMED-CURRENT / OUTDATED (+modern replacement) / UNVERIFIABLE, with citations. Primary sources only: `npm view`, official AI SDK docs, official Mysten dApp Kit docs (live + Context7 `/websites/sdk_mystenlabs_dapp-kit`), unpacked MCP SDK 1.29.0 source, and the real portaldot-mcp files.

## Sources Checked

- `npm view <pkg> version dist-tags deprecated time` (run 2026-06-19) for `ai`, `@ai-sdk/react`, `@ai-sdk/rsc`, `@mysten/dapp-kit`, `@mysten/dapp-kit-react`, `@mysten/dapp-kit-core`, `@mysten/sui`, `wagmi`, `@modelcontextprotocol/sdk`.
- Official AI SDK docs (WebFetch, live): `ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage`, `ai-sdk.dev/docs/ai-sdk-rsc/migrating-to-ui`; `vercel.com/blog/ai-sdk-6`.
- Official Mysten dApp Kit docs via Context7 `/websites/sdk_mystenlabs_dapp-kit` (the "Legacy package" note, `useDAppKit`, `signTransaction`, `signAndExecuteTransaction`, DAppKit instance return type) + live `@mysten/dapp-kit-react` README (`npm view ... readme`).
- MCP SDK 1.29.0 unpacked source on disk: `/tmp/package/dist/esm/types.js` (protocol constants), `/tmp/package/dist/esm/server/sse.js` (`@deprecated` SSEServerTransport), `ls` of `/tmp/package/dist/esm/server/` (stdio/streamableHttp/webStandardStreamableHttp/express/auth present).
- Real portaldot-mcp files: `/tmp/portaldot-mcp/packages/web/lib/wallet.tsx`, `/tmp/portaldot-mcp/packages/web/app/app/page.tsx`.

## Verified Facts

### Versions (npm, 2026-06-19) — all three briefs' version claims CONFIRMED-CURRENT
- `ai` = **6.0.208** (latest). dist-tags: `ai-v5: 5.0.204`, `beta: 7.0.0-beta.182`, `canary: 7.0.0-canary.176`. v6 stable, v7 only beta/canary. CONFIRMED.
- `@ai-sdk/react` = **3.0.210** (latest; the 3.x line pairs with `ai@6`). CONFIRMED.
- `@ai-sdk/rsc` = **2.0.208** (latest); npm `deprecated` field is **empty**. CONFIRMED (not npm-deprecated, but docs say not-for-production — see below).
- `@mysten/dapp-kit` = **1.1.1**; `@mysten/dapp-kit-react` = **2.1.3**; `@mysten/dapp-kit-core` = **1.6.1**; `@mysten/sui` = **2.19.0**. None carry an npm `deprecated` field. CONFIRMED.
- `wagmi` = **3.6.17**. CONFIRMED.
- `@modelcontextprotocol/sdk` = **1.29.0** (latest; no `2.x` on the `latest` tag). CONFIRMED.

### GENUI brief — pattern currency

1. **`useChat` + typed `tool-<name>` parts + 4 states + `addToolOutput` (not `addToolResult`), `output` field (not `result`), `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls`** — **CONFIRMED-CURRENT.** Verified verbatim at `ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage`: method is `addToolOutput`, field is `output`, states are exactly `input-streaming` / `input-available` / `output-available` / `output-error`, and `sendAutomaticallyWhen` + `lastAssistantMessageIsCompleteWithToolCalls` is the documented auto-resubmit. The `addToolResult({ result })` name (in many high-star repos/tutorials) is the OUTDATED pre-v5 name → replacement is `addToolOutput({ output })`.

2. **AI SDK RSC (`@ai-sdk/rsc`, `streamUI`/`render`/`createStreamableUI`/`useUIState`) is the OUTDATED genUI path** — **CONFIRMED.** Official migration doc (`ai-sdk.dev/docs/ai-sdk-rsc/migrating-to-ui`), verbatim: *"AI SDK RSC is marked as experimental, and we do not recommend using it for stable production environments… we strongly recommend migrating to AI SDK UI."* Modern replacement: `streamText()` route handler + `useChat()` rendering from typed tool parts. The Vercel `rsc-genui` template is the trap. CONFIRMED-CURRENT verdict that the genUI app must use the `useChat`/tool-parts path, not RSC.

3. **"Agent proposes, user signs" via no-`execute` tool → `input-available` sign card → `addToolOutput`** — **CONFIRMED-CURRENT** for AI SDK 5/6 (this is the mechanism, and portaldot's web route uses exactly the omit-`execute` split). NEW additional option: AI SDK 6 native `needsApproval` (below).

4. **AI SDK 6 native human-in-the-loop** — **CONFIRMED.** `vercel.com/blog/ai-sdk-6`: AI SDK 6 released **Dec 22 2025**, stable; *"you get human-in-the-loop control with a single `needsApproval` flag, no custom code required"*; *"Set `needsApproval: true`…"*, conditional `needsApproval` function, UI enters **`approval-requested`** state, handled via **`addToolApprovalResponse`**. (The brief said it didn't retrieve the exact API — now retrieved: `approval-requested` + `addToolApprovalResponse`.) For "user signs," the omit-`execute` card and `needsApproval` are both current; omit-`execute` fits "tool returns unsigned tx, wallet signs" more directly.

### GENUI brief — Sui wallet wiring: the flagged UNKNOWN is now RESOLVED, and a brief assumption is CORRECTED

5. **The dapp-kit generation question — RESOLVED.** Mysten's own docs (Context7 `/websites/sdk_mystenlabs_dapp-kit`, sourced from `sdk.mystenlabs.com/dapp-kit`) explicitly label the old package **Legacy**, verbatim: *"The legacy `@mysten/dapp-kit` package… only supports the deprecated JSON RPC API and will not be updated for gRPC or GraphQL. New projects should use `@mysten/dapp-kit-core` and `@mysten/dapp-kit-react`."*
   - **Verdict: `@mysten/dapp-kit` (legacy TanStack hooks `useSignAndExecuteTransaction`/`useSignTransaction`) is OUTDATED-for-new-builds.** Not npm-`deprecated`, but officially "legacy" and frozen on the deprecated JSON-RPC API. Modern replacement: **`@mysten/dapp-kit-react` `useDAppKit()`** action API.
   - The new action API is confirmed: `useDAppKit()` returns a `dAppKit` instance with `signAndExecuteTransaction({ transaction })` → `TransactionResult` discriminated union (`result.Transaction.digest` / `result.FailedTransaction.status.error?.message`), and **`signTransaction({ transaction })` → `{ bytes, signature }`** (base64 BCS + base64 sig; sets sender automatically; handles both `sui:signTransaction` and `sui:signTransactionBlock`). `signTransaction` is the exact primitive for "tool builds unsigned tx → wallet signs → execute elsewhere." Both `Transaction` and base64 `string` bytes are accepted as input, so a tool can hand pre-built bytes straight in.

6. **CORRECTION to all three briefs: portaldot-mcp is NOT a Sui/dapp-kit reference for the signing layer.** `/tmp/portaldot-mcp/packages/web/lib/wallet.tsx` imports **`@polkadot/extension-dapp`** (`web3Enable`, `web3Accounts`, `web3FromSource`) — it is a **Polkadot/Substrate** app with a hand-rolled wallet provider. It does **not** import `@mysten/dapp-kit` at all. So:
   - portaldot remains a valid reference for the **shared-registry architecture and the omit-`execute` "user signs" split** (chain-agnostic).
   - portaldot is **NOT** evidence about which Sui dapp-kit generation to use, and the GENUI brief's recommendation to "verify against what portaldot-mcp imports before committing" the dapp-kit choice is moot — it imports Polkadot. The dapp-kit decision is settled instead by Mysten's "Legacy package" note above.

7. **wagmi EVM analog** (`useSendTransaction`/`useWriteContract`/`useSignTypedData`, `wagmi@3.6.17`) — version CONFIRMED-CURRENT; reference-only (not on the Sui path).

### MCP brief — pattern currency

8. **`@modelcontextprotocol/sdk@1.29.0`, spec `2025-11-25`, `registerTool` with Zod, stdio + Streamable HTTP, HTTP+SSE superseded** — **CONFIRMED-CURRENT** from unpacked source: `/tmp/package/dist/esm/types.js` → `LATEST_PROTOCOL_VERSION = '2025-11-25'`, `DEFAULT_NEGOTIATED_PROTOCOL_VERSION = '2025-03-26'`, `SUPPORTED = ['2025-11-25','2025-06-18','2025-03-26','2024-11-05','2024-10-07']`. `/tmp/package/dist/esm/server/sse.js` carries verbatim *"@deprecated SSEServerTransport is deprecated. Use StreamableHTTPServerTransport instead."* Transport files present: `stdio.js`, `streamableHttp.js`, `webStandardStreamableHttp.js`, `express.js`, `auth/`. `SSEServerTransport` (two-endpoint HTTP+SSE) is OUTDATED → replacement `StreamableHTTPServerTransport` / `WebStandardStreamableHTTPServerTransport`.
   - **Streamable HTTP transport is the CURRENT recommended remote transport** (and `WebStandardStreamableHTTPServerTransport` for Next.js/edge). CONFIRMED-CURRENT.
   - 2.0.0-alpha line exists but is NOT `latest` — correctly flagged outdated-for-production. CONFIRMED.

9. **Unsigned-tx pattern + "embed shared registry in-process, don't run a network MCP between your own web app and your own tools"** — architectural recommendation, sound and consistent with current SDK shape; the third-party MCP repos cited are illustrative prior art (UNVERIFIABLE-as-currency, but not version-sensitive claims).

### REFERENCES brief — pattern currency

10. **AI SDK `inputSchema` is current; `parameters` is the deprecated (v4-era) field** — **CONFIRMED-CURRENT** (consistent with the live tool-usage doc using `inputSchema`/`tool()`). Repos still on `tool({ parameters })` (suiware/ai-tools, goat-sdk TS adapter) are AI-SDK-v4-era on that call site — copy their fan-out shape, not their AI-SDK call sites. The verdict in the brief stands.
11. **Zod 4 `z.toJSONSchema()` preferred over `zod-to-json-schema`** — consistent with MCP SDK zod peer `^3.25 || ^4.0`; current. agentkit (uses `z.toJSONSchema`) is the cleaner current model; goat (uses `zod-to-json-schema`) is the wider-fan-out but older-call-site model. Verdict stands.
12. **Shortlist repos** (agentkit, goat, SylphxAI/tools, suiware/ai-tools, cyanheads/git-mcp-server, mcp-use) — not re-fetched in this pass (currency of their *patterns* is governed by claims 10–11, which are confirmed). UNVERIFIABLE-in-this-pass at the per-repo file level, but no version-sensitive claim depends on them beyond the `inputSchema`/`parameters` axis, which is settled.

## Inferences

- **Net verdict: the three briefs are CURRENT, with two corrections.** Every version pin is the live `latest`. Every named pattern (AI SDK genUI `useChat`/typed tool-parts/`addToolOutput`; RSC-is-the-trap; MCP Streamable HTTP over deprecated SSE; the dapp-kit signing flow) is confirmed against primary sources.
- **Correction 1 (material): adopt the NEW Sui dapp-kit.** Use `@mysten/dapp-kit-react@2.1.3` + `@mysten/dapp-kit-core@1.6.1` with `useDAppKit()` → `signTransaction` (unsigned-tx → wallet signs) or `signAndExecuteTransaction`. Do NOT base the Sui web surface on the legacy `@mysten/dapp-kit@1.1.1` hooks — Mysten labels them legacy/JSON-RPC-frozen. This directly addresses Abu's fear: the legacy hooks are the "outdated-but-popular" trap (most existing Sui tutorials/repos use them).
- **Correction 2: portaldot is Polkadot.** Keep it as the shared-registry + omit-`execute` architectural reference (chain-agnostic), but ignore it for Sui-signing specifics. Any DeepBook Sui signing code must come from the new dapp-kit docs, not from portaldot.
- For the genUI signing step, the omit-`execute` card + `addToolOutput` loop is the right primitive; `signTransaction` returns `{ bytes, signature }` you can either execute via `signAndExecuteTransaction` or pass back through `addToolOutput`. AI SDK 6 `needsApproval`/`approval-requested` is a valid newer alternative but heavier than omit-`execute` for "return unsigned tx, sign in wallet."
- Pin via `pnpm add ai @ai-sdk/react @modelcontextprotocol/sdk zod @mysten/dapp-kit-react @mysten/dapp-kit-core @mysten/sui` (let pnpm resolve `latest`); stay on `ai@6`/`@ai-sdk/react@3` (not v7 beta) and MCP SDK `1.29.x` (not 2.0-alpha).

## Unknowns And Questions

- **AI SDK v7** is in active beta (`7.0.0-beta.182`); not for a build now, but the v6→v7 jump is on the horizon. No action needed; flagging so the stack isn't assumed evergreen.
- **`@mysten/dapp-kit-core`/`-react` are young** (core `1.6.1`, react `2.1.3`, both published 2026-06-17). They are officially blessed but newer/less-battle-tested than the legacy hooks. Recommend a quick `/tmp` spike of `useDAppKit().signTransaction` against a Sui wallet before architecting around it (per the tire-kick rule). The API surface is confirmed from docs; runtime behavior is not yet hands-verified here.
- **Per-repo file-level currency for the REFERENCES shortlist** (agentkit/goat/SylphxAI MCP wiring) was not re-fetched in this pass; the only currency-sensitive axis (`inputSchema` vs `parameters`, zod-4 JSON schema) is confirmed, so this is low-risk. Re-clone agentkit + SylphxAI to `/tmp` only if byte-level confirmation is wanted.

Key reference files (absolute): `/tmp/portaldot-mcp/packages/web/lib/wallet.tsx` (Polkadot wallet provider — confirms portaldot is NOT Sui), `/tmp/portaldot-mcp/packages/web/app/app/page.tsx`; MCP SDK source `/tmp/package/dist/esm/types.js`, `/tmp/package/dist/esm/server/sse.js`.