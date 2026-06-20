# DeepBook V3 Spot Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a DeepBook V3 spot-CLOB tool family (balance manager, pools, swaps, orders, + stretch staking/governance/flash-loans) to the shared registry so the agent can operate the spot DEX across MCP, CLI, and web — same sign-at-the-edge model as Predict.

**Architecture:** Purely additive. The registry was built for this — `Surface` already includes `'spot'`, `allTools`/`getToolsForAdapter`/the MCP loop are surface-agnostic, and the web's `useSubmitTx` builds+signs any write tool. We wrap the official `@mysten/deepbook-v3` SDK (`DeepBookClient`) in our `defineRead`/`defineWrite` ToolDefs: reads call the SDK's devInspect query methods; writes call the SDK's `(tx) => …` builders and return the UNSIGNED `Transaction`. The DeepBook `BalanceManager` (spot trading account) is threaded through `ToolContext.balanceManagerId`, mirroring Predict's `managerId`.

**Tech Stack:** `@mysten/deepbook-v3` (official SDK), `@mysten/sui@2.19` (Transaction + SuiClient), `zod@4`, existing `@deepbookie/core` registry. Worktree: `feat/spot-tools` (off `feat/web-pages`, so the web shell exists for Phase C).

## Global Constraints

- Tools build UNSIGNED transactions; signing happens at the edge (local key for MCP/CLI, browser wallet for web). Core holds no key.
- Files ≤ 300 lines (soft 200); eslint `max-lines` fails CI at 300.
- Named constants only — pool keys / coin keys / env names live in a constants module. No magic strings.
- Structured logging with Pino; errors handled in adapters, not core. Never `console.log`.
- Reads run server-side (indexer/devInspect); writes return `Promise<Transaction>`.
- Every tool tagged `surface: 'spot'`.
- Inputs stay human-decimal (the SDK scales to base units internally) — consistent with Predict tools.
- Manual-test every feature on real testnet as built (real digest / real read) — never batch testing to the end.

---

## File structure

**Create:**
- `packages/core/src/spot/client.ts` — build a `DeepBookClient` from a `ToolContext` (env testnet, `client`, `address`=sender, `balanceManagers: { MAIN: { address: ctx.balanceManagerId } }`); export the `MANAGER_KEY = 'MAIN'` constant + helpers.
- `packages/core/src/spot/constants.ts` — testnet env id (`DEEPBOOK_ENV='testnet'`), the SDK pool/coin key catalog re-export, `BALANCE_MANAGER_TYPE` (for effects parsing), default DEEP-fee policy.
- `packages/core/src/tools/spot-reads.ts` — read tools (`spotReadTools`).
- `packages/core/src/tools/spot-writes.ts` — write tools (`spotWriteTools`).

**Modify:**
- `packages/core/src/context.ts` — add `balanceManagerId?: string` to `ToolContext` + `createContext` opts.
- `packages/core/src/registry.ts` — spread `spotReadTools` / `spotWriteTools` into `allTools`.
- `packages/core/package.json` — add `@mysten/deepbook-v3` dependency.
- `packages/mcp/src/index.ts` — capture a created `BalanceManager` id (mirror `newManagerId`) + read `DEEPBOOKIE_BALANCE_MANAGER_ID` env into the context.
- `packages/cli/src/cli.ts` — same balanceManagerId threading (confirm it loops over `allTools`; add the env + created-id capture).
- `CLAUDE.md` — note the spot surface + DeepBook coin/DEEP-fee reality.

**Phase C (web) — create later, after A/B land:**
- `apps/web/src/lib/bff/spot.ts` + `apps/web/src/app/api/spot/*` (cached pool reads), `apps/web/src/lib/hooks/useSpot*.ts`, `apps/web/src/app/(app)/spot/page.tsx` + `apps/web/src/components/widgets/Spot*.tsx` (pools list, swap card, orders + balance-manager panel). Reuses `useSubmitTx` unchanged.

---

## Canonical patterns (every tool follows one of these)

**Read tool:**
```ts
const spotMidPrice = defineRead({
  name: 'spot_mid_price',
  description: 'Mid price of a DeepBook spot pool (e.g. SUI_DBUSDC).',
  surface: 'spot',
  inputSchema: z.object({ poolKey: z.string() }),
  read: async (a, ctx) => {
    const db = spotClient(ctx);            // packages/core/src/spot/client.ts
    return { poolKey: a.poolKey, midPrice: await db.midPrice(a.poolKey) };
  },
});
```

**Write tool (unsigned build):**
```ts
const spotSwapBaseForQuote = defineWrite({
  name: 'spot_swap_base_for_quote',
  description: 'Swap an exact base amount for quote on a spot pool.',
  surface: 'spot',
  inputSchema: z.object({
    poolKey: z.string(),
    amount: z.number().positive(),
    minOut: z.number().min(0),
    deepAmount: z.number().min(0).optional(),
  }),
  build: async (a, ctx) => {
    const tx = new Transaction();
    const db = spotClient(ctx);
    const [baseOut, quoteOut, deepOut] = db.deepBook.swapExactBaseForQuote({
      poolKey: a.poolKey, amount: a.amount, minOut: a.minOut, deepAmount: a.deepAmount ?? 0,
    })(tx);
    tx.transferObjects([baseOut, quoteOut, deepOut], requireSender(ctx));
    return tx;
  },
});
```

`spotClient(ctx)` constructs the `DeepBookClient` once (verify exact constructor against the installed `dist/.d.ts`; cast `ctx.client as unknown as SuiClient` — it exposes the devInspect/getObject surface the SDK uses, same nuance as predict-client).

---

## Phase A — Core spot tools + SDK (the foundation)

### Task A1: Add the SDK + spot client + context field
**Files:** Create `packages/core/src/spot/{client.ts,constants.ts}`; Modify `packages/core/src/context.ts`, `packages/core/package.json`.
**Interfaces — Produces:** `spotClient(ctx: ToolContext): DeepBookClient`, `MANAGER_KEY`, `SPOT_POOLS`/`SPOT_COINS` catalogs; `ToolContext.balanceManagerId?: string`.

- [ ] Add `@mysten/deepbook-v3` (resolve latest compatible with `@mysten/sui@2.19`) to `packages/core/package.json`; `pnpm install` in the worktree.
- [ ] Read the installed `@mysten/deepbook-v3` `dist/*.d.ts` to confirm: `DeepBookClient` constructor shape, `env` values, `balanceManagers` config, and method names (`midPrice`, `getQuantityOut`, `account`, `checkManagerBalance`, `accountOpenOrders`, `getLevel2TicksFromMid`, `poolTradeParams`, `lockedBalance`; `balanceManager.*`; `deepBook.*`; `governance.*`; `flashLoans.*`) + the testnet pool/coin key catalogs.
- [ ] Write `spot/constants.ts` (env, pool/coin catalogs from the SDK, `BALANCE_MANAGER_TYPE`, DEEP-fee defaults).
- [ ] Write `spot/client.ts` (`spotClient(ctx)` + `MANAGER_KEY='MAIN'`).
- [ ] Add `balanceManagerId?` to `ToolContext` + `createContext`.
- [ ] Verify: `pnpm --filter @deepbookie/core typecheck` green.
- [ ] Commit: `feat(core): deepbook-v3 SDK + spot client + balanceManagerId context`.

### Task A2: Spot read tools
**Files:** Create `packages/core/src/tools/spot-reads.ts`; Modify `registry.ts`.
**Produces:** `spotReadTools: ReadTool[]`.

Tools (each = the read pattern above, mapped to the SDK):

| tool | SDK call | inputs |
|---|---|---|
| `spot_list_pools` | catalog from `SPOT_POOLS` | — |
| `spot_mid_price` | `db.midPrice(poolKey)` | poolKey |
| `spot_orderbook` | `db.getLevel2TicksFromMid(poolKey, ticks)` | poolKey, ticks? |
| `spot_swap_quote` | `db.getQuantityOut(poolKey, baseQty, quoteQty)` | poolKey, baseQuantity?, quoteQuantity? |
| `spot_pool_params` | `db.poolTradeParams(poolKey)` + `db.poolBookParams(poolKey)` | poolKey |
| `spot_account` | `db.account(poolKey, MANAGER_KEY)` + `db.accountOpenOrders` + `db.lockedBalance` | poolKey (requires balanceManagerId) |
| `spot_balance` | `db.checkManagerBalance(MANAGER_KEY, coinKey)` | coinKey (requires balanceManagerId) |

- [ ] Write all read tools; export `spotReadTools`; spread into `allTools` in `registry.ts`.
- [ ] Verify build/typecheck/lint green.
- [ ] **Real testnet:** add a throwaway script (or `pnpm derisk`-style) that calls `spot_mid_price` on `SUI_DBUSDC` and `spot_swap_quote` — confirm a real number returns. Capture the value.
- [ ] Commit: `feat(core): spot read tools (pools, midprice, orderbook, quote, account)`.

### Task A3: Spot write tools (balance manager, swaps, orders)
**Files:** Create `packages/core/src/tools/spot-writes.ts`; Modify `registry.ts`.
**Produces:** `spotWriteTools: WriteTool[]`.

| tool | SDK builder | notes |
|---|---|---|
| `spot_create_balance_manager` | `db.balanceManager.createAndShareBalanceManager()` | one-time; parse new BM id from effects |
| `spot_deposit` | `db.balanceManager.depositIntoManager(MANAGER_KEY, coinKey, amount)` | requires balanceManagerId |
| `spot_withdraw` | `db.balanceManager.withdrawFromManager(MANAGER_KEY, coinKey, amount, sender)` | + `withdrawAll` variant via `amount?` |
| `spot_swap_base_for_quote` | `db.deepBook.swapExactBaseForQuote(params)` | transferObjects outputs → sender |
| `spot_swap_quote_for_base` | `db.deepBook.swapExactQuoteForBase(params)` | transferObjects outputs → sender |
| `spot_place_limit_order` | `db.deepBook.placeLimitOrder(params)` | poolKey, price, quantity, isBid, payWithDeep?, clientOrderId |
| `spot_place_market_order` | `db.deepBook.placeMarketOrder(params)` | poolKey, quantity, isBid, payWithDeep? |
| `spot_cancel_order` | `db.deepBook.cancelOrder(poolKey, MANAGER_KEY, orderId)` | orderId (protocol id) |
| `spot_cancel_all_orders` | `db.deepBook.cancelAllOrders(poolKey, MANAGER_KEY)` | poolKey |

- [ ] Write all write tools (unsigned-build pattern); a shared `requireBalanceManager(ctx)` guard (clear error → "create a balance manager first"). Export `spotWriteTools`; spread into `allTools`.
- [ ] Verify build/typecheck/lint green; a vitest smoke per write that `build()` returns a `Transaction` without throwing (zero-address sender ok).
- [ ] Commit: `feat(core): spot write tools (balance manager, swaps, orders)`.

## Phase B — MCP + CLI exposure (real-key signing)

### Task B1: Thread + capture the BalanceManager
**Files:** Modify `packages/mcp/src/index.ts`, `packages/cli/src/cli.ts`.
- [ ] Add `newBalanceManagerId(changes)` (mirror `newManagerId`, match `BALANCE_MANAGER_TYPE`); on a spot write, if a BM was created, set `ctx.balanceManagerId` + return it. Read `DEEPBOOKIE_BALANCE_MANAGER_ID` into `createContext`.
- [ ] Verify: `node` MCP/CLI lists the new `spot_*` tools (`tools: allTools.length` grows).
- [ ] **Real testnet (local key):** `spot_create_balance_manager` → digest; fund it (`spot_deposit`); `spot_mid_price`; one `spot_swap_base_for_quote` OR `spot_place_limit_order` → real digest. Capture digests.
- [ ] Commit: `feat(mcp,cli): expose spot tools + capture balance manager id`.

## Phase C — Web spot surface (reuses sign-at-edge)
### Task C1: BFF + hooks + page + widgets
**Files:** Create `apps/web/src/lib/bff/spot.ts`, `apps/web/src/app/api/spot/{pools,book}/route.ts`, `apps/web/src/lib/hooks/useSpot*.ts`, `apps/web/src/app/(app)/spot/page.tsx`, `apps/web/src/components/widgets/Spot{PoolTable,SwapCard,Orders}.tsx`; Modify nav (`DesktopNav`/`MobileTabBar` add "Spot"), `apps/web/src/lib/hooks/useSubmitTx.ts` (pass `balanceManagerId` into the browser ToolContext).
- [ ] Cached pool reads via the BFF (same `cachedRead` pattern); swap quote via direct chain (like `useQuote`).
- [ ] Swap card + orders panel call `useSubmitTx('spot_swap_…' / 'spot_place_limit_order', input, …)` — the existing handshake signs it.
- [ ] Verify via Preview MCP (desktop + mobile) + a real browser swap digest.
- [ ] Commit: `feat(web): spot surface (pools, swap, orders, balance manager)`.

## Phase D — Stretch + review + PR
- [ ] Add `spot_stake`, `spot_unstake`, `spot_submit_proposal`, `spot_vote`, `spot_claim_rebates` (governance namespace). Flash loans only as a constrained borrow→swap→return template (single-PTB) — clearly scoped; skip if not clean.
- [ ] `pr-review-toolkit` over the full diff; fix findings.
- [ ] `pnpm build && pnpm lint && pnpm typecheck && pnpm test` green; PR via `gh`; merge on green CI.

## Testnet reality (must handle, not guess)
- Spot uses DeepBook coins (`DBUSDC`/`DBUSDT`/`DEEP`/`SUI`), separate from Predict's `dusdc`. The BalanceManager holds these. Fees are paid in `DEEP` unless the pool is whitelisted and `payWithDeep:false` uses the input coin. Surface this in tool descriptions + a "needs DEEP / use a whitelisted pool" note. Confirm which testnet pools are whitelisted from the SDK config.
- Acquiring testnet `DEEP`/`DBUSDC`: confirm faucet/path at build time; document in CLAUDE.md.

## Risks
- `DeepBookClient` expects `@mysten/sui` `SuiClient`; our `ctx.client` is `SuiJsonRpcClient` — cast and verify devInspect reads actually return (Task A2's real-testnet step is the gate).
- Flash loans are a single-PTB hot-potato; only a fixed template is agent-safe → stretch.
- Branch is off `feat/web-pages` (needed for Phase C). Merge order: web first, then spot (or merge spot which carries web).

## Self-review notes
- Spec coverage: prompt.md families → balanceManager (A3/C1), pools (A2), orders (A3), swaps (A3), flash loans (D), staking/governance (D). ✅ All mapped.
- Each phase ends with a real testnet artifact (read value or digest), matching this repo's "manual-test every feature" rule rather than pure unit TDD (tx-builder code is verified by real execution).
