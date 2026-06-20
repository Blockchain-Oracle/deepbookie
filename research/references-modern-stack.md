All version claims confirmed live as of today (2026-06-19): `ai@6.0.208`, `@ai-sdk/react@3.0.210`, `@modelcontextprotocol/sdk@1.29.0`, `@mysten/dapp-kit@1.1.1` (legacy), `@mysten/dapp-kit-react@2.1.3` (new), `@mysten/dapp-kit-core@1.6.1`, `@mysten/sui@2.19.0`, `wagmi@3.6.17`, `zod@4.4.3`. v7 of `ai` is beta/canary only.

Here is the merged guide.

---

# DeepBook Predict Agent — References + Modern-Stack Guide

**Product shape (the thing every section serves):** ONE shared tool registry, reused across four surfaces — (a) a LOCAL stdio MCP (Cursor/Claude Code) that signs with a local wallet, (b) a CLI, (c) an agent skill, (d) a generative-UI web app (Vercel AI SDK) that signs with a CONNECTED BROWSER wallet. **Tools build UNSIGNED transactions; each surface signs its own way.** No developer-facing SDK. `portaldot-mcp` (studied at `/tmp/portaldot-mcp`) is the proven architectural shape.

All versions verified live via `npm view` on 2026-06-19. CURRENT vs OUTDATED verdicts come from primary docs (AI SDK docs, Mysten dApp Kit docs, unpacked MCP SDK 1.29.0 source) — not stars.

---

## 1) Curated reference projects — the shortlist to study

Ordered by usefulness to this build. Each: what to copy / what to AVOID.

### Anchor — `portaldot-mcp` (`/tmp/portaldot-mcp`, on disk, studied)
The proven shape for "one registry, many surfaces."
- **Copy:** `defineTool({ name, description, inputShape (zod RawShape), handler }) → ToolDef`, exported as a **flat `allTools: ToolDef[]`** from `packages/core/src/registry.ts` (`packages/core/src/lib/tool.ts`). MCP surface loops `allTools` into `server.registerTool(...)` over `StdioServerTransport` (`packages/mcp/src/index.ts`). Web surface wraps the same `allTools` as AI SDK `tool({...})`, and **write tools are defined with NO `execute`** so the browser wallet signs — the "AI proposes, user signs" split (`packages/web/app/api/chat/route.ts:40-57`). Skill = single `SKILL.md` with YAML frontmatter + intent→tool table.
- **AVOID / CORRECTIONS (verified, important):**
  - portaldot is **Polkadot/Substrate**, not Sui. `packages/web/lib/wallet.tsx` imports `@polkadot/extension-dapp` (`web3Enable`, `web3Accounts`, `web3FromSource`); it does **not** import `@mysten/dapp-kit`. Use it for the chain-agnostic *architecture* and the *omit-`execute`* signing split only — **NOT** as a Sui dapp-kit reference.
  - `packages/core/src/chain/tx.ts` `submitSigned(...)` signs **server-side** with a `KeyringPair`. That is the *opposite* of your unsigned-tx-return design. Mirror the registry/adapter shape; replace server-side signing with "return unsigned tx, sign at the edge."

### 1. `coinbase/agentkit` — best CURRENT primary model (1,253★, pushed 2026-06-17, TS+Py)
- **Copy:** the cleanest current "one action core, N framework adapters" split. Core exposes `getActions(): Action[]` where `Action = { name, description, schema (zod), invoke }`. Adapters in `typescript/framework-extensions/{vercel-ai-sdk, model-context-protocol, langchain}`. `getVercelAITools()` → `tool({ description, inputSchema: action.schema, execute })` (modern `inputSchema`). `getMcpTools()` → `{ tools, toolHandler }` that is **transport-agnostic** (you wire stdio/HTTP yourself) and uses Zod-4 native **`z.toJSONSchema()`**.
- **Verdict: CURRENT.** Best production idioms to copy for the adapter layer and JSON-schema conversion. `@coinbase/agentkit@0.10.4`, `@coinbase/agentkit-vercel-ai-sdk@0.1.0`, `@coinbase/agentkit-model-context-protocol@0.2.0`.

### 2. `goat-sdk/goat` — widest fan-out proof (998★, pushed 2026-05-30, TS+Py)
- **Copy:** the proof that ONE core fans out to MCP + Vercel AI + 6 more frameworks. `@goat-sdk/core` `ToolBase { name, description, parameters (zod), execute }` + `WalletClientBase`; `getTools({wallet, plugins}) → ToolBase[]`. The wallet-client-in-core is directly analogous to your "tools build unsigned tx, surface signs." MCP adapter `getOnChainTools()` → `{ listOfTools(), toolHandler }`, transport-agnostic.
- **Verdict: CURRENT architecture, OUTDATED call sites.** The TS adapter still uses `tool({ parameters })` and `zod-to-json-schema` (AI-SDK-v4 era). **Copy the fan-out shape, NOT its AI-SDK call sites.** `@goat-sdk/core@0.5.0`, `@goat-sdk/adapter-vercel-ai@0.2.10`, `@goat-sdk/adapter-model-context-protocol@0.2.11`.

### 3. `SylphxAI/tools` — purest structural skeleton (4★, pushed 2025-12-10, TS)
- **Copy:** the **physical package topology** that is almost 1:1 with your plan. `packages/tools-core/src/defineTool.ts` (neutral factory) + `tools-adaptor-mcp` + `tools-adaptor-vercel`, then per-domain `tools-{name}` with **per-tool `*.schema.ts`** files and a matching `tools-{name}-mcp` adapter.
- **Verdict: CURRENT structure (uses `inputSchema`/`defineTool`), low-star = not battle-tested.** Use as the layout skeleton, trust agentkit/goat for production idioms.

### 4. `suiware/ai-tools` — closest domain match, partly outdated (16★, pushed 2026-02-23, TS, Sui-native)
- **Copy:** Sui-specific tool design (transfer/stake/swap, suins resolution) and the "author once, derive MCP" mapper: `packages/mcp/src/utils/mappers.ts` `mapVercelToolToMcpTool()`, type `McpTool { description, paramsSchema: ZodRawShape, cb }`. MCP runs stdio.
- **Verdict: PARTIALLY OUTDATED.** Core tools authored as `tool({ parameters: z.object… })` (AI SDK v4) and couple the core to the AI SDK type. **Mine for Sui tool design + the mapper idea; rename `parameters`→`inputSchema` and author in a neutral `defineTool` instead.**

### 5. `cyanheads/git-mcp-server` — transport-layer reference (222★, pushed 2026-05-06, TS)
- **Copy:** the canonical single MCP server shipping **BOTH STDIO and Streamable HTTP** from one tool set. Use only as the reference for structuring transport selection so the same registry serves local stdio today and remote Streamable-HTTP later.
- **Verdict: CURRENT — transport reference only** (not a multi-surface example).

### 6. `mcp-use/mcp-use` — highest-traffic current framework (10,123★, pushed 2026-06-19, TS)
- **Copy:** current server/transport idioms; MCP Apps, inspector, hot-reload. Not a "one core many surfaces" example.
- **Verdict: CURRENT, framework-grade.** Scan for idioms; don't adopt wholesale.

### Reference templates (genUI web surface)
- `vercel/chatbot` (formerly `vercel/ai-chatbot`, `github.com/vercel/chatbot`) — **primary** current Next.js genUI template: `message.parts`, typed tool parts, genUI on `part.state === 'output-available'`.
- AI SDK cookbook `render-visual-interface-in-chat` — canonical "one React component per tool," `askForConfirmation` + `getWeatherInformation`, current `addToolOutput` API.
- **TRAP template — do NOT use:** `vercel.com/templates/next.js/rsc-genui` ("Generative UI Chatbot with RSC") is the paused RSC path (see §4).

### Inverse-philosophy patterns to NOT adopt as the source of truth
- Vercel `mcp-to-ai-sdk` (blog 2025-09-17) and Brian Gershon's "registry→MCP+CLI" (2025-11-19) **generate** vendored AI-SDK tools / a CLI **from** an MCP server (MCP = source of truth). Good for consuming *third-party* MCPs safely; **wrong for you** — you own the core and adapt outward. Keep the neutral `defineTool` registry authoritative (the agentkit/goat/SylphxAI/portaldot pattern), don't let a generator become the source of truth.

---

## 2) The modern stack (with versions)

All pinned via live `npm view` (2026-06-19). Install with `pnpm add` / let it resolve `latest`; do not hardcode from memory. **Stay on the v6 `ai` line and `@ai-sdk/react@3` (NOT v7 beta); stay on MCP SDK `1.29.x` (NOT 2.0-alpha).**

| Layer | Package | Version (latest) | Notes |
|---|---|---|---|
| AI SDK core | `ai` | **6.0.208** | v6 stable since Dec 22 2025. `ai-v5: 5.0.204`, `beta/canary: 7.x` (not stable). |
| AI SDK React | `@ai-sdk/react` | **3.0.210** | exports `useChat` for v6 (3.x pairs with `ai@6`). |
| AI SDK RSC | `@ai-sdk/rsc` | 2.0.208 | **frozen / not-for-production** (see §4). Do not install. |
| MCP SDK (TS) | `@modelcontextprotocol/sdk` | **1.29.0** | spec `2025-11-25`; zod peer `^3.25 || ^4.0`. |
| Sui dApp Kit (NEW, **use this**) | `@mysten/dapp-kit-react` + `@mysten/dapp-kit-core` | **2.1.3** + **1.6.1** | `useDAppKit()` action API. |
| Sui dApp Kit (LEGACY, **avoid for new build**) | `@mysten/dapp-kit` | 1.1.1 | TanStack hooks; officially "legacy" (see §4). |
| Sui SDK | `@mysten/sui` | **2.19.0** | `Transaction` builder. |
| Zod | `zod` | **4.4.3** | enables native `z.toJSONSchema()`. |
| EVM (reference only) | `wagmi` | 3.6.17 | analog, not on the Sui path. |

### MCP transport (current, from unpacked SDK 1.29.0 source)
- Spec defines exactly **two** transports: **stdio** and **Streamable HTTP**. Latest protocol = **`2025-11-25`** (`/tmp/package/dist/esm/types.js:2` `LATEST_PROTOCOL_VERSION`; `DEFAULT_NEGOTIATED = '2025-03-26'`).
- **Local MCP → `StdioServerTransport`** (`@modelcontextprotocol/sdk/server/stdio.js`). Clients SHOULD support stdio whenever possible.
- **Remote/web → Streamable HTTP.** For Next.js/edge/serverless use **`WebStandardStreamableHTTPServerTransport`** (`@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js`) — Request/Response-native, runs on Node 18+/Workers/Deno/Bun. For Node/Express use `StreamableHTTPServerTransport`. Stateless mode = `sessionIdGenerator: undefined`.
- **OUTDATED — do not use `SSEServerTransport`** (the old two-endpoint HTTP+SSE from protocol 2024-11-05). SDK marks it `@deprecated` (`/tmp/package/dist/esm/server/sse.js:12`): *"Use StreamableHTTPServerTransport instead."*

### MCP tool definition (current)
`server.registerTool(name, { title?, description, inputSchema (Zod shape), outputSchema? }, handler)` — SDK auto-converts Zod → JSON Schema 2020-12. Handler returns `{ content: [{ type:'text', text }], structuredContent?, isError? }`. Legacy `server.tool(...)` exists but `registerTool` is the documented current form.

### Vercel genUI API (current)
- Server route: tools via **`tool({ description, inputSchema: z.object({...}), execute? })`** (`inputSchema`, **not** `parameters`), passed to `streamText({ model, tools })`, returned via `toUIMessageStreamResponse()`; incoming converted with `convertToModelMessages()`.
- Client: `useChat` from `@ai-sdk/react` wired with `transport: new DefaultChatTransport({ api: '/api/chat' })`. Render typed parts `tool-<toolName>`; `switch(part.type)` then `switch(part.state)`.
- **Four tool-part states:** `input-streaming` → `input-available` (render the actionable sign card from `part.input`) → `output-available` (render `part.output`) → `output-error` (`part.errorText`).
- Feed a client result back with **`addToolOutput({ tool, toolCallId, output })`** (NOT `addToolResult`/`result`). Auto-resubmit with `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` (imported from `ai`).

### CLI framework — the one surface you design, not copy
None of the shortlist ships a strong CLI adapter. Lightest current path: loop the same `allTools` and bind each `ToolDef` to a `commander` (or `citty`) subcommand — identical loop to the MCP/web adapters, providing a local-key `execute`. (Open question in §6: commander vs citty vs clipanion currency — resolve with a focused check before locking.)

### Skill format
Single `SKILL.md` with YAML frontmatter (`name`, `description`, `version`) + an intent→tool table that points at the CLI/registry (portaldot shape). The skill invokes the CLI; the CLI calls the shared registry with the local-key signer.

---

## 3) The two-MCP / two-signer design

Abu's "two MCP" is really **two independent axes**, which separate cleanly:

- **Axis A — transport (where the server runs):** LOCAL = stdio subprocess (Cursor/Claude Code spawn it). REMOTE = Streamable HTTP server (a URL).
- **Axis B — signing (who holds the key):** LOCAL keypair in the process env vs. a CONNECTED BROWSER wallet held by the user.

**Decouple tool logic from signing entirely: the core tool builds and returns an UNSIGNED transaction; the surface signs at the edge.** This is the one contract reused across all four surfaces.

| Surface | Transport (Axis A) | Signing (Axis B) |
|---|---|---|
| Local MCP (Cursor / Claude Code) | **stdio** (`StdioServerTransport`) | local wallet key from env (spec: stdio retrieves creds "from the environment") |
| CLI | n/a (direct call into shared registry) | local wallet key |
| Agent skill | invokes the CLI/registry | local wallet key |
| GenUI web app (Vercel AI SDK) | tools in-process (recommended) **or** behind `WebStandardStreamableHTTPServerTransport` | **connected browser wallet** via dapp-kit |

### The "agent proposes, USER signs" loop (genUI web surface)
This is the exact mechanism, confirmed current for AI SDK 5/6:
1. **Server route:** register the write/trade tool with `inputSchema` but **NO `execute`**. A tool without `execute` is not run server-side — it becomes a client-rendered tool. The tool input carries the params (or the pre-built unsigned tx bytes) the card needs.
2. **Client:** in the `tool-<name>` part, on `state: 'input-available'`, render a confirm-and-sign card from `part.input`.
3. **User signs** via the connected wallet (dapp-kit, below).
4. **Feed back:** `addToolOutput({ tool, toolCallId, output: { digest, ... } })`; with `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` the model continues with the signed result in context.

> AI SDK 6 also ships **native human-in-the-loop**: set `needsApproval: true` on a tool, the SDK emits an **`approval-requested`** part and you respond with **`addToolApprovalResponse`**. Valid, newer alternative — but heavier than omit-`execute` for "return unsigned tx, sign in wallet." Use omit-`execute` as the primary; reserve `needsApproval` if you later want server-executed-with-confirmation.

### Sui browser-wallet wiring — use the NEW dapp-kit (resolved)
Mysten's own docs label the old package **Legacy**: *"The legacy `@mysten/dapp-kit` package… only supports the deprecated JSON RPC API and will not be updated for gRPC or GraphQL. New projects should use `@mysten/dapp-kit-core` and `@mysten/dapp-kit-react`."* Use the new action API:

```ts
import { useDAppKit, useCurrentAccount } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';

const dAppKit = useDAppKit();

// Sign-only — the primitive for "tool builds unsigned tx → wallet signs"
const { bytes, signature } = await dAppKit.signTransaction({ transaction: tx });
// bytes = base64 BCS, signature = base64; sender set automatically.
// Handles both sui:signTransaction and sui:signTransactionBlock.

// Or sign + execute in one step
const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
if (result.FailedTransaction) { /* result.FailedTransaction.status.error?.message */ }
result.Transaction.digest // success
```
Both a `Transaction` object and a base64 `string` are accepted as input, so a tool can hand pre-built bytes straight in. EVM analog for reference: wagmi `useSendTransaction` / `useWriteContract` / `useSignTypedData`.

### Local-key signer (MCP / CLI / skill)
Same `ToolDef` + same `inputSchema`. The local surfaces provide an `execute` that signs the returned unsigned tx with a keypair read from env (e.g. `@mysten/sui` `Ed25519Keypair` + the tx the tool built). Cleanest contract: **the core tool always returns an unsigned tx; signing is pushed entirely to the edge** — local surfaces sign with the env key, the web surface hands it to the connected wallet.

### Do you even need a network MCP?
If the only web surface is your own Vercel app, **import the shared registry in-process and skip the Streamable HTTP hop entirely** — lower-risk hackathon path. Reserve the HTTP transport (and any OAuth) for the case where third-party MCP clients connect to a hosted endpoint. MCP OAuth is **HTTP-only and OPTIONAL** (spec: stdio "SHOULD NOT follow this specification, and instead retrieve credentials from the environment") — so for the MVP, **skip OAuth**: local surfaces are env-credentialed, the web app signs in the browser.

---

## 4) Deprecated traps to avoid — the "do NOT copy this old pattern" list

| OUTDATED pattern | Why it's a trap | CURRENT replacement |
|---|---|---|
| **AI SDK RSC** (`@ai-sdk/rsc` / `ai/rsc`): `streamUI()`, `experimental_streamUI`, `render()`, `createStreamableUI()`, `createStreamableValue()`, `useUIState()`/`useAIState()` | Official: *"marked as experimental, we do not recommend… for stable production"*; Vercel: *"development of AI SDK RSC is currently paused."* Failure modes: can't abort streams, flicker, multi-Suspense crashes, quadratic data transfer. Not npm-`deprecated`, but frozen. | `streamText()` route + `useChat()` rendering from typed `tool-<name>` parts; object streaming → `useObject()`; UI state from `message.parts`, not `useUIState`. |
| `addToolResult({ result })` | Pre-v5 name; in many high-star repos/tutorials. | **`addToolOutput({ output })`**. |
| `useChat({ api: '/api/chat' })` (string `api` prop) | Pre-v5 wiring. | `useChat({ transport: new DefaultChatTransport({ api }) })`. |
| `message.content` string + `experimental_toolCall` / `toolInvocations` rendering | Pre-v5. If a reference renders from `message.content` or `toolInvocations`, it's pre-v5. | `message.parts[]` with typed `tool-<name>` parts. |
| `tool({ parameters: z.object(...) })` | AI-SDK-v4-era field. Present in goat-sdk TS adapter and suiware/ai-tools. | `tool({ inputSchema: z.object(...) })`. |
| `zod-to-json-schema` package | Older conversion (goat-sdk). | Zod 4 native **`z.toJSONSchema()`** (agentkit). |
| **`@mysten/dapp-kit` legacy hooks** (`useSignAndExecuteTransaction`, `useSignTransaction`, TanStack `mutate`) | Officially "legacy," frozen on the deprecated JSON-RPC API. **This is the exact "outdated-but-popular" trap** — most existing Sui tutorials/repos use it. | `@mysten/dapp-kit-react` **`useDAppKit()`** action API + `@mysten/dapp-kit-core`. |
| `SSEServerTransport` (two-endpoint HTTP+SSE) | Superseded since protocol 2024-11-05; SDK marks `@deprecated`. | `StreamableHTTPServerTransport` / `WebStandardStreamableHTTPServerTransport`. |
| MCP SDK `2.0.0-alpha` | Real but **not** the npm `latest` tag. | Stay on `1.29.x`. |
| `ai@7` (beta/canary) | Not stable. | Stay on `ai@6` / `@ai-sdk/react@3`. |
| `vercel.com/templates/next.js/rsc-genui` template | The RSC (paused) path. | `vercel/chatbot` template + cookbook `render-visual-interface-in-chat`. |
| Server-side signing in the tool (portaldot's `submitSigned` with a `KeyringPair`) | Couples the tool to one signer; wrong for multi-surface. | Return unsigned tx; sign at the edge per surface. |
| Generating tools FROM an MCP (`mcp-to-ai-sdk`, Gershon registry→MCP) as your source of truth | Inverts ownership; you own the core. | Keep the neutral `defineTool` registry authoritative; adapt outward. |
| Treating portaldot as a Sui dapp-kit reference | It's Polkadot (`@polkadot/extension-dapp`). | Use new dapp-kit docs for all Sui signing. |

---

## 5) How it maps to our architecture — one registry → MCP + CLI + skill + genUI + landing

```
packages/core           defineTool({ name, description, inputSchema (zod), buildTx })
  └─ registry.ts        export const allTools: ToolDef[]   ← single source of truth
                         every tool's buildTx returns an UNSIGNED Sui Transaction
        │
        ├─ packages/mcp        loop allTools → server.registerTool(...)
        │                      StdioServerTransport · execute = sign w/ env Ed25519Keypair
        │
        ├─ packages/cli        loop allTools → commander/citty subcommands
        │                      execute = sign w/ env key  (one surface you design)
        │
        ├─ skills/<name>/      SKILL.md frontmatter + intent→tool table → invokes CLI
        │
        └─ packages/web        loop allTools → tool({ inputSchema })  WRITE tools omit execute
           (Vercel AI SDK)     useChat + typed tool-<name> parts
                               input-available → sign card → useDAppKit().signTransaction
                               → addToolOutput({ output:{ digest } })
                               registry imported in-process (no network MCP hop)
                               + landing page (premium-ui registries)
```

Concrete rules so the same registry serves all five:
- Define each tool so **`execute` is optional/injectable**. Web omits it (browser signs); MCP/CLI/skill inject a local-key `execute`. The **same `inputSchema` is reused everywhere** — author it once in neutral `defineTool` (portaldot/SylphxAI style), never coupled to the AI SDK or MCP type.
- **Core always returns an unsigned tx**; signing is pushed to the edge. Local surfaces sign with the env key; the web surface hands the unsigned tx to `useDAppKit().signTransaction` / `signAndExecuteTransaction`.
- **Adapter layer pattern** to copy: agentkit's `getActions()` + thin per-framework adapters; SylphxAI's physical package split (`tools-core` + `tools-adaptor-mcp` + `tools-adaptor-vercel` + per-tool `*.schema.ts`).
- **Web app stays in-process** (no Streamable HTTP server between your own app and your own tools). Reserve `WebStandardStreamableHTTPServerTransport` + (optional) OAuth strictly for hosting a remote MCP that *third-party* clients hit.
- **Landing page:** static marketing surface, separate from the genUI app; build via premium-ui registries (out of stack scope here).

---

## Open Questions

1. **In-process registry vs. hosted remote MCP** — the only thing that forces Streamable HTTP + (optionally) OAuth is wanting third-party MCP clients to hit a hosted endpoint. For the MVP, is the web app the only web surface? If yes, embed the registry in-process and skip the network hop.
2. **CLI framework currency** — none of the shortlist proves a strong TS CLI adapter. Need a focused 2026 currency check on `commander` vs `citty` vs `clipanion`/`yargs` before locking the CLI surface. This is the one surface designed rather than copied.
3. **Always-unsigned vs branching tool returns** — recommend "core always returns unsigned tx, sign at edge" for a single contract; the alternative (local surfaces auto-sign, web returns unsigned) also works on one registry. Design call for Abu.
4. **New dapp-kit is young** — `@mysten/dapp-kit-core@1.6.1` / `@mysten/dapp-kit-react@2.1.3` (both published 2026-06-17) are officially blessed but newer than the legacy hooks. Per the tire-kick rule, spike `useDAppKit().signTransaction` against a real Sui wallet in `/tmp` before architecting around it — API surface is confirmed from docs; runtime behavior is not yet hands-verified.
5. **AI SDK 6 `needsApproval` vs omit-`execute`** — both current. omit-`execute` is recommended for "return unsigned tx, sign in wallet"; evaluate `needsApproval`/`approval-requested`/`addToolApprovalResponse` only if you later want server-executed-with-confirmation.
6. **`ai@7` on the horizon** — v7 is in active beta (`7.0.0-beta.182`); the v6→v7 jump is coming. Build on v6 now; don't assume the stack is evergreen.
7. **Per-repo file-level currency** for agentkit/goat/SylphxAI MCP wiring was not re-fetched in the final pass; the only currency-sensitive axis (`inputSchema` vs `parameters`, Zod-4 JSON schema) is confirmed. Re-clone agentkit + SylphxAI to `/tmp` only if byte-level confirmation is wanted.

### Key reference files (absolute)
- `/tmp/portaldot-mcp/packages/core/src/lib/tool.ts` — `defineTool` factory
- `/tmp/portaldot-mcp/packages/core/src/registry.ts` — flat `allTools` array
- `/tmp/portaldot-mcp/packages/mcp/src/index.ts` — stdio MCP adapter loop
- `/tmp/portaldot-mcp/packages/web/app/api/chat/route.ts:40-57` — omit-`execute` "user signs" split
- `/tmp/portaldot-mcp/packages/web/lib/wallet.tsx` — confirms portaldot is **Polkadot**, not Sui
- `/tmp/portaldot-mcp/packages/core/src/chain/tx.ts` — `submitSigned` (server-side signing — the pattern to AVOID)
- `/tmp/portaldot-mcp/packages/skills/portaldot/SKILL.md` — skill format
- `/tmp/package/dist/esm/types.js` — MCP protocol version constants (`2025-11-25`)
- `/tmp/package/dist/esm/server/sse.js` — `@deprecated SSEServerTransport`