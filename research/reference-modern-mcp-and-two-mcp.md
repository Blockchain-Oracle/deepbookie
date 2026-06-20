I now have comprehensive, current, primary-source data on every point. I have what I need to write the deliverable.

## Scope
Document the CURRENT MCP spec + `@modelcontextprotocol/sdk` (TypeScript) and resolve Abu's "two MCP" distinction for the DeepBook Predict agent product. Covers: (1) current SDK + spec version and the modern tool-definition API; (2) STDIO vs Streamable HTTP transports and the superseded HTTP+SSE transport; (3) local-stdio-signs-with-local-wallet vs remote/web-signs-with-browser-wallet reconciliation + the unsigned-tx return pattern; (4) remote/HTTP + wallet-web references; (5) MCP OAuth current state. All version-pinned. Sui transaction specifics out of scope except where they intersect the unsigned-tx pattern (a sibling research file should own the Sui SDK detail).

## Sources Checked
- `npm view @modelcontextprotocol/sdk version` / `time --json` — latest **1.29.0**, published 2026-03-30 (terminal output).
- SDK 1.29.0 tarball unpacked at `/tmp/package` — direct reads of compiled source:
  - `/tmp/package/dist/esm/types.js:2-4` (protocol version constants)
  - `/tmp/package/dist/esm/server/sse.js:12`, `sse.d.ts:35` (`@deprecated` notices)
  - `/tmp/package/dist/esm/server/streamableHttp.d.ts:1-30` and `webStandardStreamableHttp.d.ts:1-40` (transport class docs)
  - `/tmp/package/package.json` (zod peer dep `^3.25 || ^4.0`; exports `./client`, `./server`; presence of `express.js`, `stdio.js`, `streamableHttp.js`, `webStandardStreamableHttp.js`, `auth/`)
- Context7 `/modelcontextprotocol/typescript-sdk/v1.29.0` — `registerTool` w/ zod, Stdio + StreamableHTTP transport setup, stateless mode, `createMcpExpressApp`, `mcpAuthMetadataRouter`.
- WebFetch `modelcontextprotocol.io/specification` → schema points to `schema/2025-11-25/schema.ts` (current spec version).
- WebFetch `…/specification/2025-06-18/basic/transports` (transport definitions + HTTP+SSE supersession wording).
- WebFetch `…/specification/2025-11-25/basic/authorization` (current OAuth model).
- Local reference repo `/tmp/portaldot-mcp` (proven shared-registry shape): `packages/mcp/src/index.ts`, `packages/core/src/lib/tool.ts`, `packages/core/src/chain/tx.ts`, registry/tools layout.
- WebSearch for Sui unsigned-tx → browser-wallet MCP references (repos + Sui docs).

## Verified Facts

**(1) Current SDK + spec version + tool definition**
- **SDK: `@modelcontextprotocol/sdk@1.29.0`** is latest (`dist-tags.latest = 1.29.0`, 2026-03-30). Note a **2.0.0-alpha** line exists on Context7 (`_modelcontextprotocol_node_2.0.0-alpha.2`) but is **not** the npm `latest` tag — do not build on alpha.
- **Spec: latest protocol version is `2025-11-25`.** Confirmed two ways: the spec site's authoritative schema is `schema/2025-11-25/schema.ts`, and the SDK hardcodes it: `/tmp/package/dist/esm/types.js:2` → `LATEST_PROTOCOL_VERSION = '2025-11-25'`. `SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25','2025-06-18','2025-03-26','2024-11-05','2024-10-07']`. `DEFAULT_NEGOTIATED_PROTOCOL_VERSION = '2025-03-26'` (the version assumed when a client sends no version header).
- **Current tool-definition API = `server.registerTool(name, { title?, description, inputSchema, outputSchema? }, handler)`** where `inputSchema` is a **Zod shape** (the SDK auto-converts Zod → JSON Schema 2020-12). The handler returns `{ content: [{ type: 'text', text }], structuredContent? , isError? }`. Source: Context7 `/modelcontextprotocol/typescript-sdk/v1.29.0` (`docs/protocol.md`, `examples/server/src/serverGuide.examples.ts`).
- **zod peer dep is `^3.25 || ^4.0`** (`/tmp/package/package.json:118`). Use `pnpm add zod` (resolves a satisfying version) — do not pin from memory. The legacy `server.tool(...)` exists but `registerTool` is the current documented form.

**(2) Transports**
- Spec defines exactly **two** standard transports: **stdio** and **Streamable HTTP**. "Clients **SHOULD** support stdio whenever possible." (transports spec page.)
- **stdio** = client launches server as a subprocess; newline-delimited JSON-RPC over stdin/stdout; stderr is for logging only; server **MUST NOT** write non-MCP to stdout. This is the LOCAL transport for Cursor / Claude Code.
- **Streamable HTTP** = single HTTP endpoint (e.g. `/mcp`) handling POST + GET, optionally upgrading to SSE for streaming; supports session IDs via `Mcp-Session-Id` header; can run **stateless** (`sessionIdGenerator: undefined`). This is the REMOTE/web transport.
- **The old "HTTP+SSE" transport (two-endpoint, from protocol 2024-11-05) is SUPERSEDED.** Spec wording, verbatim: *"This replaces the HTTP+SSE transport from protocol version 2024-11-05."* The SDK marks it deprecated in code: `/tmp/package/dist/esm/server/sse.js:12` → *"@deprecated SSEServerTransport is deprecated. Use StreamableHTTPServerTransport instead."* **Do not use `SSEServerTransport`.** Backwards-compat (hosting both endpoints) is only for talking to legacy clients.
- **SDK transport classes (1.29.0), with exact import paths:**
  - `StdioServerTransport` — `@modelcontextprotocol/sdk/server/stdio.js`
  - `StreamableHTTPServerTransport` — `@modelcontextprotocol/sdk/server/streamableHttp.js` — Node `http` (IncomingMessage/ServerResponse) wrapper; internally wraps the web-standard transport via `@hono/node-server`. Use this for an **Express/Node** remote server.
  - `WebStandardStreamableHTTPServerTransport` — `@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js` — built on Web `Request`/`Response`/`ReadableStream`; "can run on any runtime that supports Web Standards: Node.js 18+, Cloudflare Workers, Deno, Bun." **This is the one to use inside a Next.js route handler / edge / serverless** (directly relevant to a Vercel AI SDK web app). Source: `/tmp/package/dist/esm/server/webStandardStreamableHttp.d.ts:1-7`.
  - `createMcpExpressApp({ host })` — `@modelcontextprotocol/sdk/server/express.js` — convenience Express app with **DNS-rebinding protection auto-enabled** when host is `127.0.0.1`/`localhost`, **not** when `0.0.0.0`. (Context7 `docs/server.md`.)
- Spec security requirements for Streamable HTTP: server **MUST** validate the `Origin` header (DNS-rebinding defense); when local, **SHOULD** bind to `127.0.0.1` not `0.0.0.0`; **SHOULD** authenticate all connections.

**(3) The "two MCP" reconciliation + unsigned-tx pattern**
This is the crux. There are two distinct axes Abu is conflating into "two MCP," and they separate cleanly:

- **Axis A — transport (where the server runs):** LOCAL = stdio process (Cursor/Claude Code spawn it). REMOTE = Streamable HTTP server (a URL the web app or a remote client hits).
- **Axis B — signing (who holds the key):** LOCAL wallet/keypair available to the server process vs. a CONNECTED BROWSER wallet held by the end user.

The current best practice is to **decouple tool logic from signing entirely**: tools build and return an **UNSIGNED transaction**; the surface signs. This is exactly the shared-registry shape `portaldot-mcp` proves (`packages/core/src/lib/tool.ts` `defineTool(...)` → uniform `ToolDef` that both `packages/mcp` and `packages/web` register without knowing the concrete shape; `packages/mcp/src/index.ts` loops `allTools` into `server.registerTool`). One caveat on the reference: portaldot's `packages/core/src/chain/tx.ts` `submitSigned(...)` signs **server-side** with a `KeyringPair`, so portaldot is a model for the *shared-registry architecture* but NOT for the unsigned-tx return — that part is the new design.

The four surfaces map onto the two axes:
| Surface | Transport (Axis A) | Signing (Axis B) |
|---|---|---|
| Local MCP (Cursor / Claude Code) | **stdio** (`StdioServerTransport`) | local wallet key from env (stdio auth = "retrieve credentials from the environment" per spec) |
| CLI | n/a (direct call into shared registry) | local wallet key |
| Agent skill | invokes the CLI/registry | local wallet key |
| Generative-UI web app (Vercel AI SDK) | tools embedded in-process **or** behind `WebStandardStreamableHTTPServerTransport` | **connected browser wallet** |

- **The unsigned-tx pattern (current best practice, confirmed across multiple independent MCP-wallet repos):** the MCP tool **builds transaction bytes and returns them**; the surface that has the key signs + submits. Private keys **never** reach a remote MCP server. Confirmed shapes: [`zhangzhongnan928/mcp-blockchain-server`](https://github.com/zhangzhongnan928/mcp-blockchain-server) ("Web DApp for secure transaction signing… creates unsigned transactions for user approval… private keys never leave the user's wallet") and [`nikicat/mcp-wallet-signer`](https://github.com/nikicat/mcp-wallet-signer) ("routes blockchain transactions to browser wallets for signing"). On Sui specifically, the browser side calls `signAndExecuteTransaction` / the dApp-kit `useSignAndExecuteTransaction` hook with the tx the tool returned ([Sui signing-and-execution docs](https://sdk.mystenlabs.com/sui/transactions/signing-and-execution), [Sui Wallet Standard](https://docs.sui.io/onchain-finance/asset-custody/wallets/wallets/wallet-standard)).
- **Practical rule for this product:** put tx-building in the shared core. A tool returns either the executed result (local surfaces that hold a key) **or** the unsigned tx (web surface, signed by the browser wallet). Cleanest is for the *core tool always returns an unsigned tx*; local surfaces sign with the local key, the web surface hands it to the connected wallet. That keeps one registry and one tool contract across all four surfaces, with signing pushed entirely to the edge.

**(4) Remote/HTTP + wallet-web references**
- SDK ships runnable HTTP examples: `examples/server/src/simpleStreamableHttp.ts` (session-managed, with `--oauth` / `--oauth-strict` flags) and `simpleStatelessStreamableHttp.ts` (stateless, `sessionIdGenerator: undefined`). (Context7 `src/examples/README.md`.) Stateless is the right default for a serverless/edge web deployment.
- For Next.js / Vercel: use `WebStandardStreamableHTTPServerTransport` in a route handler (it's Request/Response-native). Pair the web app's tool calls with browser-wallet signing via Sui dApp-kit. References above (`zhangzhongnan928/mcp-blockchain-server`, `nikicat/mcp-wallet-signer`) are the closest published "MCP tool builds tx → browser wallet signs" prior art.

**(5) MCP auth (OAuth) current state — `2025-11-25`**
- Authorization is **OPTIONAL**, **HTTP-only**: *"Implementations using an STDIO transport SHOULD NOT follow this specification, and instead retrieve credentials from the environment."* → your **local stdio MCP does no OAuth**; it reads the local wallet from env. Only a **remote HTTP** MCP would.
- Model: **OAuth 2.1** (draft-ietf-oauth-v2-1-13). MCP server = **resource server**; MCP client = OAuth client; authorization server is separate/external.
- Hard requirements when you do add HTTP auth: server **MUST** implement RFC 9728 Protected Resource Metadata (advertise `authorization_servers`); client **MUST** use it for discovery; client **MUST** implement **PKCE (S256)** and the **RFC 8707 `resource` parameter**; server **MUST** validate token audience (reject tokens not issued for it; no token passthrough). Client registration priority: pre-registration → **Client ID Metadata Documents** (the new preferred mechanism, HTTPS-URL client_id) → Dynamic Client Registration (RFC 7591, now "for backwards compatibility").
- SDK support exists: `mcpAuthMetadataRouter` / `mcpAuthRouter`, `requireBearerAuth`, under `@modelcontextprotocol/sdk/server/auth/*` (`/tmp/package/dist/esm/server/auth` present). For a hackathon, **skip OAuth** — local stdio surfaces are env-credentialed and the web app signs in the browser, so no MCP-layer OAuth is required for the MVP.

## Inferences
- **Recommended stack for this product (current, not legacy):** `@modelcontextprotocol/sdk@^1.29` + `zod` (let `pnpm add` resolve within `^3.25 || ^4.0`); tools via `registerTool` with Zod input shapes; **`StdioServerTransport`** for the local MCP; **`WebStandardStreamableHTTPServerTransport`** if/when you expose a remote/web MCP endpoint (Vercel-friendly), or just import the shared tool registry directly into the Vercel AI SDK app and skip a network MCP hop entirely.
- **Architecture to mirror:** portaldot's `defineTool` → uniform `ToolDef` → one `registry` consumed by `mcp` and `web`. Adopt this exactly; change only the signing boundary (return unsigned tx instead of `submitSigned` server-side).
- **Don't introduce a network MCP between your own web app and your own tools** unless you specifically need third-party MCP clients. For the Vercel app, importing the shared registry in-process is simpler than running a Streamable HTTP server and is the lower-risk hackathon path. Reserve the HTTP transport for "other MCP clients connect to us remotely."
- The 2.0.0-alpha SDK line is real but not `latest`; treat as outdated-for-production. Stay on 1.29.x.

## Unknowns And Questions
- **Does the product actually need a remote/HTTP MCP at all?** If the only web surface is your own Vercel AI SDK app, you can embed the tool registry in-process (no Streamable HTTP server). Confirm whether you want third-party MCP clients to hit a hosted endpoint — that's the only thing that forces the HTTP transport + (optionally) OAuth.
- **Exact Sui unsigned-tx serialization** (what bytes a tool returns and how the browser wallet consumes them via dApp-kit / Wallet Standard) is Sui-SDK-specific and should be pinned in a sibling research file — I verified the *pattern* and entry points but not version-exact Mysten `@mysten/sui` / `@mysten/dapp-kit` APIs here.
- **Whether to standardize tool returns on "always unsigned tx"** vs. branching (local surfaces auto-sign, web returns unsigned). Both work on one registry; pick one for consistency. Recommendation above is "always return unsigned, sign at the edge," but this is a design call for Abu.

Key reference files (all absolute): `/tmp/portaldot-mcp/packages/mcp/src/index.ts`, `/tmp/portaldot-mcp/packages/core/src/lib/tool.ts`, `/tmp/portaldot-mcp/packages/core/src/chain/tx.ts`; SDK source `/tmp/package/dist/esm/types.js`, `/tmp/package/dist/esm/server/{stdio,streamableHttp,webStandardStreamableHttp,sse}.d.ts`.