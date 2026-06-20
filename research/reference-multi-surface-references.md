Confirmed — `SylphxAI/tools` has `tools-core/src/defineTool.ts` (the exact `defineTool` abstraction portaldot uses) plus separate `*-mcp` and `*-vercel` adaptor packages and per-tool `.schema.ts` files. I have a complete, well-cited shortlist. Delivering.

## Scope
Find current OSS projects that ship ONE shared tool core reused across multiple surfaces (MCP server + CLI + agent skill + optionally a Vercel AI SDK web app) — the "one registry, many surfaces" shape. Beyond portaldot-mcp (already studied), surface 3-6 more strong, recent examples with structure, transport, CLI framework, skill format, and a CURRENT-vs-OUTDATED verdict per repo. Read-only; externals inspected via GitHub API (not cloned).

## Sources Checked
- `/tmp/portaldot-mcp` real files: `packages/core/src/lib/tool.ts`, `registry.ts`, `packages/mcp/src/index.ts`, `packages/web/app/api/chat/route.ts`, `packages/skills/portaldot/SKILL.md` (the proven reference shape).
- GitHub API (live, `gh api` / `gh search`): `goat-sdk/goat`, `coinbase/agentkit`, `suiware/ai-tools`, `SylphxAI/tools`, `cyanheads/git-mcp-server`, `mcp-use/mcp-use`, `twilio-labs/mcp`, `stefanoamorelli/estonia-ai-kit` — incl. reading adapter source (`mappers.ts`, MCP/vercel adapter `index.ts`, `ToolBase.ts`, `defineTool.ts`).
- `npm view` versions: `@goat-sdk/core@0.5.0`, `@goat-sdk/adapter-vercel-ai@0.2.10`, `@goat-sdk/adapter-model-context-protocol@0.2.11`, `@coinbase/agentkit@0.10.4`, `@coinbase/agentkit-vercel-ai-sdk@0.1.0`, `@coinbase/agentkit-model-context-protocol@0.2.0`.
- Context7 `/vercel/ai` (AI SDK 5/6 migration docs) for tool-definition currency + human-in-the-loop.
- WebSearch / WebFetch: Vercel `mcp-to-ai-sdk` blog (2025-09-17), Brian Gershon "registry → MCP + CLI" blog (2025-11-19).

## Verified Facts

### The reference shape (portaldot-mcp) — what the new project mirrors
- `defineTool({ name, description, inputShape (zod RawShape), handler })` returns a uniform `ToolDef`; `registry.ts` exports a **flat `allTools: ToolDef[]` array** (`packages/core/src/lib/tool.ts`, `registry.ts`).
- MCP surface: loops `allTools`, calls `server.registerTool(name, {description, inputSchema: t.inputShape}, …)` over **`StdioServerTransport`** (`packages/mcp/src/index.ts`).
- Web surface: same `allTools`, wrapped with AI SDK `tool({description, inputSchema, execute})`; **write tools defined with NO `execute`** so the browser wallet signs ("AI proposes, user signs") — `packages/web/app/api/chat/route.ts:40-57`. This is the exact unsigned-tx / per-surface-signing split your product needs.
- Skill: single `SKILL.md` with YAML frontmatter (`name`, `description`, `version`) + an intent→tool table (`packages/skills/portaldot/SKILL.md`).

### CURRENCY anchor (authoritative, Context7 `/vercel/ai`)
- AI SDK 5+: tool field is **`inputSchema`**; **`parameters` is deprecated** (migration guide + common-errors doc). portaldot already uses `inputSchema` (current). Any repo still on `tool({ parameters })` is AI-SDK-v4-era.
- AI SDK 6 adds per-tool **`strict`** and native human-in-the-loop: server tool sets **`needsApproval: true`**, SDK emits an **`approval-requested`** tool part and pauses `execute` until the user approves — a modern alternative to the "omit execute" trick for the signing step.
- Zod 4 ships native **`z.toJSONSchema()`** (used by agentkit) — preferred over the older `zod-to-json-schema` package (still used by goat-sdk).

### Shortlist (each: shared-tool structure / MCP transport / CLI / skill / verdict)

**1. coinbase/agentkit — 1,253★, pushed 2026-06-17 (TypeScript + Python).**
- Structure: core `AgentKit` exposes **`getActions(): Action[]`** where each `Action = { name, description, schema (zod), invoke }`. Framework adapters live in `typescript/framework-extensions/{vercel-ai-sdk, model-context-protocol, langchain}` — each maps the SAME actions to its target.
- `getVercelAITools()` → `tool({ description, inputSchema: action.schema, execute })` (modern `inputSchema`). `getMcpTools()` → `{ tools: Tool[], toolHandler }` using `z.toJSONSchema(action.schema)`; **transport-agnostic** (returns tools+handler; you wire stdio/HTTP yourself). Source read: `framework-extensions/vercel-ai-sdk/src/getVercelAiTools.ts`, `framework-extensions/model-context-protocol/src/index.ts`.
- What to learn: the cleanest current "one action core, N framework adapters" split, including the canonical MCP `{tools, toolHandler}` shape and current Zod-4 JSON-schema conversion. CLI: ships `create-onchain-agent` scaffolder. **Verdict: CURRENT — best primary model to copy.**

**2. goat-sdk/goat — 998★, pushed 2026-05-30 (TS + Python).**
- Structure: `@goat-sdk/core` `ToolBase { name, description, parameters (z.ZodSchema), execute }` + `WalletClientBase` + plugins; `getTools({wallet, plugins})` returns `ToolBase[]`. `typescript/packages/adapters/` ships **8 adapters incl. both `model-context-protocol` AND `vercel-ai`** (also langchain, mastra, llamaindex, eliza). Source read: `core/src/classes/ToolBase.ts`, `adapters/model-context-protocol/src/index.ts`.
- MCP adapter `getOnChainTools()` → `{ listOfTools(), toolHandler }`, **transport-agnostic** (you connect stdio); uses older `zod-to-json-schema`.
- What to learn: the widest proof that ONE core fans out to MCP + Vercel AI + many frameworks; wallet-client-in-core is directly analogous to your "tools build unsigned tx, surface signs." **Verdict: CURRENT architecture, but the TS adapter still uses `tool({ parameters })`/`zod-to-json-schema` (AI-SDK-v4 era) — copy the fan-out shape, NOT its AI-SDK call sites.**

**3. suiware/ai-tools — 16★, pushed 2026-02-23 (TypeScript, SUI-native).**
- Structure: `packages/tools` is the shared core; tools are authored with the **Vercel AI SDK `tool()` as the canonical form**, then `packages/mcp` maps each into MCP via `mapVercelToolToMcpTool()` (`packages/mcp/src/utils/mappers.ts`, type `McpTool { description, paramsSchema: ZodRawShape, cb }`). `packages/examples` shows OpenAI/Anthropic/Google consumers; MCP runs stdio (`claude_config.example.json`).
- What to learn: closest domain match (Sui transfer/stake/swap tools, suins resolution) and a concrete "author once as an AI-SDK tool, derive MCP" mapper.
- **Verdict: PARTIALLY OUTDATED — core tools use `tool({ parameters: z.object… })` (AI SDK v4). Mine it for Sui-specific tool design and the mapper idea, but rename `parameters`→`inputSchema` and prefer authoring in a neutral `defineTool` (portaldot/SylphxAI style) rather than coupling the core to the AI SDK type.**

**4. SylphxAI/tools — 4★, pushed 2025-12-10 (TypeScript).**
- Structure: **purest textbook version of your exact pattern.** `packages/tools-core/src/defineTool.ts` (neutral tool factory) + `tools-adaptor-mcp` + `tools-adaptor-vercel`, then each domain split into `tools-{name}` (core logic + per-tool `*.schema.ts`) and `tools-{name}-mcp` (adapter): base64, fetch, filesystem, hasher, json, memory, net, pdf, rag, wait, xml. Source read confirms `defineTool.ts`, separate `.schema.ts` files, and the two adaptor packages.
- What to learn: how to physically lay out "neutral core + one MCP adaptor + one Vercel adaptor + per-tool schema files" as packages — almost 1:1 with portaldot's `lib/tool.ts` + `registry.ts`.
- **Verdict: CURRENT structure (uses `inputSchema`/`defineTool`). Low stars = not battle-tested, but the package topology is the best skeleton to imitate.**

**5. cyanheads/git-mcp-server — 222★, pushed 2026-05-06 (TypeScript).**
- Not multi-surface, but the canonical reference for a single MCP server that ships **BOTH STDIO and Streamable HTTP** transports from one tool set (description: "STDIO & Streamable HTTP"). 
- What to learn: how to structure transport selection so the SAME registry serves your local stdio MCP today and a remote Streamable-HTTP MCP later. **Verdict: CURRENT — use as the transport-layer reference only.**

**6. mcp-use/mcp-use — 10,123★, pushed 2026-06-19 (TypeScript).** Fullstack MCP framework (MCP Apps for ChatGPT/Claude + servers + agent SDK, hot-reload, inspector). Not a "one core many surfaces" example per se, but the highest-traffic current framework for building+consuming MCP; worth scanning for current server/transport idioms. **Verdict: CURRENT, framework-grade.**

### Contrast pattern to AVOID as the primary model
- **Vercel `mcp-to-ai-sdk`** (blog 2025-09-17) and **Brian Gershon's registry→MCP+CLI** (2025-11-19) describe the **inverse** philosophy: MCP server is the source of truth, and you **generate** vendored AI-SDK tools (or a CLI) FROM it. That's good for consuming *third-party* MCPs safely, but it is NOT your shape — you own the core and adapt outward. Don't let a generator become the source of truth; keep the neutral `defineTool` registry authoritative (matches portaldot, agentkit, goat, SylphxAI).

## Inferences
- The dominant CURRENT pattern across the strongest repos (agentkit, goat, SylphxAi, portaldot) is identical to your plan: a **neutral tool descriptor** (`{name, description, zod schema, handler/execute}`) in a `core` package, exported as a **flat array** or via `getActions()/getTools()`, with thin **per-surface adapters**. A heavyweight "schema-first builder/registry class" (Gershon) is NOT needed — the flat-array + `defineTool` approach is what shipped, current repos use.
- For your CLI surface, none of these top repos standardize on one framework; given portaldot already uses the array, the lightest current choice is to loop `allTools` and bind each to a `commander`/`yargs` subcommand (same loop as the MCP/web adapters). No repo here proves a CLI adapter as cleanly as it proves MCP+Vercel, so this is the one surface you'll design rather than copy.
- For the browser-wallet signing step, two current-valid options: portaldot's "omit `execute`, client signs" (works on AI SDK 5/6) OR AI SDK 6's native `needsApproval`/`approval-requested`. The omit-execute approach is simpler for "tools return unsigned tx, browser signs"; reserve `needsApproval` if you later want server-executed-with-confirmation.

## Unknowns And Questions
- Did NOT clone any repo to `/tmp` (task said clone-externals-only-if-needed; GitHub API reads sufficed). If you want byte-level confirmation of e.g. agentkit's MCP stdio wiring example or SylphxAI's `defineTool.ts` body, say so and I'll clone those two under `/tmp`.
- CLI-framework currency is unresolved by these references (none ship a strong CLI adapter); if the CLI surface matters, a focused follow-up on current TS CLI frameworks (commander vs yargs vs clipanion/citty in 2026) would close that gap.
- The two purest structural matches (suiware, SylphxAI) are low-star/low-traffic — architecturally current but not "battle-tested at scale." The battle-tested ones (agentkit, goat) are the ones to trust for production idioms; the low-star ones are better as layout skeletons.
- Several GitHub results dated "2026" were SEO/spam-shaped ("2026 Pro Edition", throwaway orgs) and were deliberately excluded — flag if you want that exclusion list.

Relevant local reference files: `/tmp/portaldot-mcp/packages/core/src/lib/tool.ts`, `/tmp/portaldot-mcp/packages/core/src/registry.ts`, `/tmp/portaldot-mcp/packages/mcp/src/index.ts`, `/tmp/portaldot-mcp/packages/web/app/api/chat/route.ts`, `/tmp/portaldot-mcp/packages/skills/portaldot/SKILL.md`.