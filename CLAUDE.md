# DeepBookie — CLAUDE.md

DeepBookie is an AI agent for trading **DeepBook Predict** (Sui's testnet, expiry-based prediction market). One shared tool registry → **MCP + CLI + skill + a generative-UI web app + landing**. **Tools build UNSIGNED Sui transactions; signing happens at the edge** (local key for MCP/CLI, browser wallet for web) — the agent holds no key.

## Scope (locked)
Predict-deep (27 tools): all Predict writes/reads + a thin Spot funding/price bridge. **No margin / maintainer / admin** (not viable on testnet). The web app is the headline. Full plan: `~/.claude/plans/graceful-wondering-phoenix.md`; rationale in `research/`; designer spec in `docs/DESIGNER-BRIEF.md`.

## Layout
- `packages/predict-client` — `@deepbookie/predict-client`: the first DeepBook Predict TS client — unsigned-PTB builders + indexer/devInspect readers + SVI→N(d2) math. Depends ONLY on `@mysten/sui`. The durable npm artifact.
- `packages/core` — neutral registry (`ToolDef`, `allTools` tagged `surface`/`kind`); reads `execute`, writes return unsigned tx.
- `packages/mcp` (stdio adapter) · `packages/cli` (commander) · `apps/web` (Next.js genUI) · `skills/deepbookie` (SKILL.md).

## Non-negotiables
- **Structured logging with Pino — never `console.log`.** ⚠️ The stdio MCP must log to **stderr** (stdout is the JSON-RPC channel).
- **Named constants, no magic numbers** — IDs / scaling / URLs live in `constants.ts`.
- **Files ≤ 300 lines** (soft target 200). eslint `max-lines` fails CI at 300.
- **Errors handled in adapters, not core.**
- **Manual-test every feature as it's built** (real testnet digest; Playwright + Chrome DevTools for web) — never batch testing to the end.

## Review & PR cadence
Per phase: run `pr-review-toolkit` over the diff + manual-test. Every 2 phases: a review workflow, then a PR via `gh`; merge to `main` only on green CI.

## Stack (pinned; resolve latest at install)
`ai@6` + `@ai-sdk/react@3` (NOT v7/RSC) · `@modelcontextprotocol/sdk@1.29` · `@mysten/sui@2.19` · `@mysten/deepbook-v3@1.5.1` (spot reads) · `zod@4` · `@mysten/dapp-kit-react` + `-core` (NOT legacy `@mysten/dapp-kit`) · `commander`.
⚠️ **`@mysten/sui` 2.x:** the JSON-RPC client is `SuiJsonRpcClient` + `getJsonRpcFullnodeUrl` from `@mysten/sui/jsonRpc` (1.x `SuiClient` / `getFullnodeUrl` are gone).

## Predict testnet facts (provisional — churn at mainnet; keep in `constants.ts`)
- Predict pkg `0xf5ea2b37…785138` · obj `0xc8736204…28028a` · registry `0x43af14fe…2a6e64`.
- dUSDC `0xe95040…::dusdc::DUSDC` (6dp) · Clock `0x6` · Indexer `https://predict-server.testnet.mystenlabs.com`.
- **Scaling:** prices / strikes / probabilities are integers **×1e9** (FLOAT_SCALING). dUSDC is **6dp**. The indexer returns these as JSON numbers.
- **dUSDC is operator-gated** (treasury cap owned; no public faucet) — acquire via the tally form, then fund a bet by **splitting a real dUSDC coin** (NOT `0x2::coin::mint`).
- Proven mint path: `create_manager → split dUSDC → predict_manager::deposit → market_key::up(oracle, expiry, strike) → predict::mint<DUSDC>`. Reference: `scripts/derisk-predict-mint.ts` (real digest `APMjNXwN…z2hF`).

## Commands
`pnpm install` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm derisk` (testnet mint demo).
