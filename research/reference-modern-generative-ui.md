I have everything needed. The Context7 results consistently show only the new `useDAppKit`/`createDAppKit` action API for the new generation and never returned the legacy `useSignAndExecuteTransaction` mutate hook code, but I confirmed that legacy hook still ships in `@mysten/dapp-kit` 1.1.1 (README still documents the hooks/components model). I have enough verified facts and one explicit unknown to flag. Synthesizing now.

## Scope

The CURRENT canonical way to build generative UI with the Vercel AI SDK for the DeepBook Predict genUI web app (the surface that signs with a CONNECTED BROWSER wallet), plus the deprecated-traps list and the "agent proposes, user signs" wallet wiring. Covers: (1) modern client pattern (`useChat` + typed tool parts + `tool()`/`inputSchema` + feeding signed results back); (2) deprecated patterns and replacements (AI SDK RSC / `streamUI` / `render()`); (3) current reference templates with versions; (4) user-signs wallet wiring with current Sui dapp-kit hooks and the wagmi/EVM analog.

## Sources Checked

- `npm view` (run 2026-06-19) for: `ai`, `@ai-sdk/react`, `@ai-sdk/rsc`, `@mysten/dapp-kit`, `@mysten/dapp-kit-react`, `@mysten/dapp-kit-core`, `@mysten/sui`, `wagmi` — versions, dist-tags, publish times, deprecation field, dependencies, README.
- Context7 `/websites/ai-sdk_dev` (AI SDK, High reputation, 8489 snippets) — useChat tool parts, client-side tools, `addToolOutput`.
- Context7 `/websites/sdk_mystenlabs_dapp-kit` (High reputation, 235 snippets) — signAndExecuteTransaction / signTransaction / useDAppKit actions.
- WebFetch (official): `ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces`, `ai-sdk.dev/docs/ai-sdk-rsc/migrating-to-ui`, `ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage`, `vercel.com/blog/ai-sdk-6`.
- WebSearch: addToolResult→addToolOutput rename; Vercel chatbot/genUI templates; Sui dapp-kit hooks.
- `wagmi.sh/react/api/hooks/useSendTransaction` (WebFetch).

Note: WebFetch 404'd on `sdk.mystenlabs.com/dapp-kit` deep pages and the AI SDK 6 announce doc path; I substituted Context7 + `vercel.com/blog/ai-sdk-6` + WebSearch for those.

## Verified Facts

### Versions (npm, 2026-06-19)
- `ai` latest = **6.0.208**. dist-tags also expose `ai-v5: 5.0.204`, `beta: 7.0.0-beta.182`, `canary: 7.0.0-canary.176`. So **AI SDK 6 is the stable line; v7 is in beta/canary.**
- `@ai-sdk/react` latest = **3.0.210** (this is the package that exports `useChat` for v6; the major track is offset — `@ai-sdk/react` 3.x pairs with `ai` 6.x).
- `@ai-sdk/rsc` latest = **2.0.208**. The `deprecated` npm field is **empty** (not formally deprecated on npm), but docs say do not use in production (see below).
- AI SDK 6 released **Dec 22 2025** (per `vercel.com/blog/ai-sdk-6`); "major version due to v3 Language Model Specification… not expected to have major breaking changes for most users."
- `@mysten/dapp-kit` latest = **1.1.1** (published 2026-06-17). `@mysten/dapp-kit-react` = **2.1.3** (2026-06-17). `@mysten/dapp-kit-core` = **1.6.1**. `@mysten/sui` = **2.19.0**. None carry an npm `deprecated` field.
- `wagmi` latest = **3.6.17**.

### (1) Modern client pattern — CURRENT
- Hook: `useChat` from **`@ai-sdk/react`**, wired with `transport: new DefaultChatTransport({ api: '/api/chat' })` (the `transport`/`DefaultChatTransport` model is the v5/v6 way; the old `api:`-string-on-useChat is gone).
- Messages are an array of `parts`. Tool calls render as **typed parts named `tool-<toolName>`** (e.g. `tool-displayWeather`, `tool-askForConfirmation`). You `switch (part.type)` then `switch (part.state)`.
- **Four tool-part states** (verified verbatim from chatbot-tool-usage docs):
  - `input-streaming` — tool input args still being generated/streamed.
  - `input-available` — args complete; for a confirm/sign card this is where you render the actionable UI using `part.input`.
  - `output-available` — result present; render the component with `part.output`.
  - `output-error` — render `part.errorText`.
- Tools are defined with the **`tool()`** factory (cookbook shows a `createTool` wrapper too) using **`inputSchema`** (a Zod schema). Example: `tool({ description, inputSchema: z.object({ location: z.string() }), execute: async ({location}) => ({...}) })`. Tools are passed to **`streamText({ model, tools })`** on the server route, returned via **`toUIMessageStreamResponse()`**; incoming messages converted with **`convertToModelMessages()`**.
- **Feeding a result back from the client: the method is `addToolOutput`, NOT `addToolResult`.** Destructure it from `useChat`: `const { messages, sendMessage, addToolOutput } = useChat(...)`. Call shape:
  ```ts
  addToolOutput({ tool: 'askForConfirmation', toolCallId: callId, output: 'Yes, confirmed.' })
  ```
  Errors: `addToolOutput({ tool, toolCallId, state: 'output-error', errorText: '...' })`. The `tool` field gives type-safe `output`.
- **Auto-resubmit after a client tool result:** set `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` (import `lastAssistantMessageIsCompleteWithToolCalls` from `ai`). This resends the conversation once all tool outputs are present so the model can continue.
- Automatic client-side tools (no UI) run in the `onToolCall({ toolCall })` callback, which calls `addToolOutput` directly (do not `await` inside to avoid deadlocks). Check `toolCall.dynamic` first for type narrowing.

### (2) DEPRECATED patterns and what replaced them
- **AI SDK RSC (`@ai-sdk/rsc`, formerly `ai/rsc`)** = the old generative-UI approach. Official guidance (`ai-sdk.dev/docs/ai-sdk-rsc/migrating-to-ui`, verbatim): *"AI SDK RSC is marked as experimental, and we do not recommend using it for stable production environments… we strongly recommend migrating to AI SDK UI."* WebSearch surfaced Vercel's stronger phrasing: **"development of AI SDK RSC is currently paused."** It is **not** marked `deprecated` on npm, but it is **frozen + not-for-production** — treat as a trap.
  - Specific OLD APIs to avoid: **`streamUI()` / `experimental_streamUI`**, **`render()`**, **`createStreamableUI()`**, **`createStreamableValue()`**, **`useUIState()` / `useAIState()`**, RSC server-actions-driven UI. Five cited failure modes: cannot abort streams, component flickering, crashes with multiple Suspense boundaries, quadratic data transfer, closed-stream update issues.
  - **Replacements:** `streamUI()` → `streamText()` (route handler) + `useChat()` (client renders components from typed tool parts); object streaming → `useObject()`; UI state lives client-side from `message.parts`, not `useUIState`.
- **`addToolResult` → `addToolOutput`** (and the `result` field → `output`). Renamed in v5; still current in v6. Many high-star repos and older tutorials use `addToolResult({ result })` — that is the OUTDATED name.
- **`useChat({ api: '/api/chat' })`** (string api prop) → **`useChat({ transport: new DefaultChatTransport({ api }) })`**.
- Pre-v5 **`message.content` string + `experimental_toolCall`** rendering → **`message.parts[]` with typed `tool-<name>` parts**. If a reference renders from `message.content` or `toolInvocations`, it's pre-v5.
- v6 adds **native human-in-the-loop**: "tool execution approval for human-in-the-loop control," plus strict mode, input examples, and `toModelOutput`, and a new **`Agent`** abstraction (`vercel.com/blog/ai-sdk-6`). For DeepBook's "user signs" flow you can still use the no-`execute` tool pattern (below); v6's approval feature is an additional, newer option to evaluate.

### (3) Current reference templates
- **`vercel/chatbot`** (formerly `vercel/ai-chatbot`) — `github.com/vercel/chatbot` — the hackable full Next.js template; uses AI Gateway, `message.parts`, typed tool parts, generative UI on `part.state === 'output-available'`. This is the primary current reference.
- **`vercel/ai`** monorepo `examples/` — `github.com/vercel/ai`.
- Cookbook: `ai-sdk.dev/cookbook/next/render-visual-interface-in-chat` (and `/resources/recipes/next/render-visual-interface-in-chat`) — the canonical "render a React component per tool" example with `askForConfirmation` + `getWeatherInformation`, current `addToolOutput` API.
- Vercel Academy: `vercel.com/academy/ai-sdk/multi-step-and-generative-ui`.
- TRAP: `vercel.com/templates/next.js/rsc-genui` ("Generative UI Chatbot with React Server Components") is the **RSC** template — that's the paused/old path; do not base the genUI app on it.
- Optional ecosystem lib seen in Context7 (not required): `@ai-sdk-tools/*` (midday-ai/ai-sdk-tools) for store/artifact streaming.

### (4) "Agent proposes, USER signs" wiring — the no-`execute` tool pattern
This is the exact mechanism for DeepBook Predict's browser-wallet surface, and it matches your "tools build UNSIGNED tx, each surface signs its own way" architecture:

1. **Server route:** register the write/trade tool **with `inputSchema` but NO `execute` function**. A tool without `execute` is not run on the server — it becomes a client-rendered tool. (Docs: *"Tools lacking an `execute` method are client-side only… require user interaction in the UI rather than automatic server execution."*) The tool input can carry the params (or the pre-built unsigned tx bytes) the card needs.
2. **Client:** in the `tool-<name>` part, on `state: 'input-available'`, render a confirm-and-sign card from `part.input`.
3. **User signs** via the connected wallet (Sui hook below). On success you get back a digest/result.
4. **Feed it back:** call `addToolOutput({ tool, toolCallId, output: { digest, ... } })`. With `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls`, the model continues with the signed result in context.

**Sui dapp-kit hooks — there are TWO live generations (critical):**

- **NEW generation (framework-agnostic core + bindings), what the current docs lead with:**
  - Packages: `@mysten/dapp-kit-core` (`1.6.1`) + `@mysten/dapp-kit-react` (`2.1.3`).
  - Hook: **`useDAppKit()`** from `@mysten/dapp-kit-react` returns a `dAppKit` instance with **action methods** (not TanStack mutations):
    ```ts
    import { useDAppKit, useCurrentAccount } from '@mysten/dapp-kit-react';
    import { Transaction } from '@mysten/sui/transactions';
    const dAppKit = useDAppKit();
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx }); // Transaction | string
    if (result.FailedTransaction) {/* result.FailedTransaction.status.error?.message */}
    result.Transaction.digest // success → digest, signatures, epoch, status, effects
    ```
  - **Sign-only** (for "build unsigned → user signs → execute elsewhere," which fits your tool-builds-unsigned model):
    ```ts
    const { bytes, signature } = await dAppKit.signTransaction({ transaction: tx });
    ```
    `bytes` = base64 BCS, `signature` = base64. Sender is set automatically; handles both `sui:signTransaction` and `sui:signTransactionBlock`.
  - Result type is a discriminated union `{ $kind: 'Transaction' | 'FailedTransaction' }`.

- **LEGACY generation (TanStack-mutation React hooks), still shipping in `@mysten/dapp-kit` `1.1.1`** — this is what portaldot-mcp-style apps and most existing repos/tutorials use:
  - `import { useSignAndExecuteTransaction, useSignTransaction, useCurrentAccount, ConnectButton } from '@mysten/dapp-kit'`
  - Hook returns a TanStack-style **`mutate` / `mutateAsync`**; you call `mutate({ transaction, chain }, { onSuccess: (result) => result.digest })`. `useSignTransaction` returns `{ bytes, signature, reportTransactionEffects }`.
  - Provider setup still uses `SuiClientProvider` + `WalletProvider` + `QueryClientProvider` (README of `@mysten/dapp-kit` 1.1.1 confirms the hooks/components + `@tanstack/react-query` model is intact).

**EVM analog (wagmi `3.6.17`) for reference:**
```ts
import { useSendTransaction, useWriteContract, useSignTypedData } from 'wagmi'
const { sendTransaction } = useSendTransaction()
sendTransaction({ to: '0x…', value: parseEther('0.01') }) // returns tx hash in `data`
```
`useWriteContract` for contract calls; `useSignTypedData` for sign-only / EIP-712. Same shape: hook gives you an imperative submit fn, returns a hash, user approves in wallet.

## Inferences

- For DeepBook Predict's genUI surface, the **no-`execute` tool + `input-available` sign card + `addToolOutput`** loop is the right primitive (matches your "tools build unsigned tx; each surface signs its own way"). The server tool should carry/return the unsigned tx (or its params) in the tool input so the card can rebuild or pass bytes straight into `dAppKit.signTransaction`/`signAndExecuteTransaction`.
- Because the tool registry is shared across MCP/CLI/skill/web, define tools so `execute` is optional/injectable: the web surface omits `execute` (client signs), while MCP/CLI provide an `execute` that signs with the local wallet. The same `inputSchema` is reused everywhere.
- **For a new build, prefer the v6 stable line** (`ai@6`, `@ai-sdk/react@3`) over v7-beta — v7 is not stable yet. Use `pnpm add ai @ai-sdk/react` to pin actual latest rather than hardcoding.
- **dapp-kit choice:** the NEW core+react split (`useDAppKit`) is where Mysten is heading and what the docs front, but the LEGACY hooks in `@mysten/dapp-kit@1.1.1` are still published and are what portaldot-mcp likely uses. Pick one generation and don't mix. I'd lean NEW (`useDAppKit` action API) for a fresh build since the docs lead with it, but verify against what portaldot-mcp actually imports before committing.

## Unknowns And Questions

- **Which dapp-kit generation is "blessed" as of June 2026?** Both `@mysten/dapp-kit@1.1.1` (legacy hooks) and `@mysten/dapp-kit-react@2.1.3` (new `useDAppKit`) were published the **same day (2026-06-17)** and neither is npm-`deprecated`. Context7 only returned the NEW `useDAppKit` action code and never the legacy `useSignAndExecuteTransaction` mutate snippet, suggesting docs have shifted to the new API — but this isn't conclusive. Recommend reading the live `@mysten/dapp-kit-react` README + `sdk.mystenlabs.com/dapp-kit/getting-started/react` and checking what `/tmp/portaldot-mcp` imports before locking the choice.
- **AI SDK v6 native tool-approval vs the no-`execute` pattern:** v6 ships "tool execution approval for human-in-the-loop control." I did not retrieve its exact API (`needsApproval` / approval part states). For "user signs" you may want to evaluate whether v6's approval flow is cleaner than the classic no-`execute` card. Worth a focused Context7 query on "tool approval needsApproval AI SDK 6" before architecting.
- **Exact `tool()` import surface in v6** (`tool` vs `dynamicTool`, and whether `inputSchema` accepts Zod v4 / standard-schema): confirm at build time with a `/tmp` spike, per your tire-kick rule.
- Could not load `vercel.com/blog/ai-sdk-6` raw (used cached fetch) or several `sdk.mystenlabs.com` deep pages (404 via WebFetch) — Context7 covered the gap, but the precise legacy-hook code (`mutate({transaction, chain}, {onSuccess})`) is reconstructed from WebSearch summaries + the `1.1.1` README, not a verbatim doc snippet.

Relevant proven-shape reference on disk: `/tmp/portaldot-mcp` (already studied) — confirm its dapp-kit imports to settle the generation question.