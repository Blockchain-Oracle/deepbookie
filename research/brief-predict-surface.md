All addresses confirmed from repo source. I have a complete picture. Compiling the report.

## Scope

Mapped DeepBook **Predict**'s full surface (branch `predict-testnet-4-16`) for an AI-agent product: the MCP tool catalog (read/query vs write/sign), the rich data types for generative UI, the SVI vol-surface model, the indexer/event API, and the composability surface (DeepBook spot, deepbook_margin, iron_bank). Read-only throughout; nothing written to the onemem dir; external repos cloned under `/tmp`.

## Sources Checked

- **Move source** (`/tmp/deepbookv3-study`, branch `predict-testnet-4-16` — confirmed via `git branch --show-current`): `packages/predict/sources/{predict,oracle,oracle_config,predict_manager,registry,vault/vault,vault/plp,market_key/market_key,market_key/range_key}.move`; `packages/deepbook_margin/sources/{margin_manager,margin_pool,pool_proxy}.move`; `packages/deepbook/sources/pool.move`.
- **Reference PTB scripts**: `/tmp/deepbookv3-study/scripts/transactions/predict/{deposit,dusdcMint,createOracle,init}.ts`; `scripts/config/constants.ts`.
- **Live indexer API**: `https://predict-server.testnet.mystenlabs.com` (probed 20+ endpoints; live JSON captured). Route catalog from `crates/predict-server/src/server.rs:41-69,165-212`.
- **TS SDK**: `/tmp/ts-sdks-study/packages/deepbook-v3` (full `src/` tree inspected).
- **Docs**: `docs.sui.io/onchain-finance/deepbook-predict/{design,contract-information}`, `.../deepbook-margin`. Web search for dUSDC faucet.
- **Migration plan**: `/tmp/deepbookv3-study/PREDICT_MIGRATION.md`.

## Verified Facts

### Deployment constants (testnet) — `scripts/config/constants.ts:80-92` + docs contract-information
- Predict package: `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138`
- Predict registry: `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64`
- Predict shared object: `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a`
- dUSDC type: `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` (6 decimals); treasury cap `0x64f8a47a0af0a3b14db3a7ce89aa206ff77a9c6b5ac0eaef6db2ea46da3ced94`; currency ID `0xf300...3e9c`
- PLP coin: `0xf5ea...5138::plp::PLP` (6 decimals)
- Clock: `0x6`. Indexer base: `https://predict-server.testnet.mystenlabs.com`

### Module set — `packages/predict/sources/`
`predict` (934 LOC, core), `oracle` (SVI state + Black-Scholes binary pricing), `oracle_config` (strike grid + curve builder), `predict_manager`, `registry` (admin), `vault/vault` + `vault/plp`, `market_key/{market_key,range_key}`, helpers (`math`, `i64`, `strike_matrix`, `rate_limiter`, `constants`), configs (`pricing_config`, `risk_config`, `treasury_config`). All values FLOAT_SCALING = 1e9 on-chain (oracle.move:71); dUSDC/PLP coins are 6-decimal.

### WRITE / SIGN entrypoints (need USER signature) — exact Move signatures

User trading & account (`predict.move`):
- `predict::create_manager(ctx): ID` — creates + shares a per-user `PredictManager` (no other args). predict.move:192
- `mint<Quote>(predict: &mut Predict, manager: &mut PredictManager, oracle: &OracleSVI, key: MarketKey, quantity: u64, clock, ctx)` — buy a binary UP/DOWN. predict.move:219
- `redeem<Quote>(predict, manager, oracle, key: MarketKey, quantity, clock, ctx)` — sell/settle binary; payout → manager balance. predict.move:285
- `redeem_permissionless<Quote>(...)` — same but only when `oracle.is_settled()`; anyone can call (keeper). predict.move:300
- `mint_range<Quote>(predict, manager, oracle, key: RangeKey, quantity, clock, ctx)` — buy a vertical range `(lower, higher]`. predict.move:331
- `redeem_range<Quote>(predict, manager, oracle, key: RangeKey, quantity, clock, ctx)`. predict.move:380
- `compact_settled_oracle(...)` — keeper housekeeping. predict.move:270

PLP liquidity (`predict.move`):
- `supply<Quote>(predict: &mut Predict, coin: Coin<Quote>, clock, ctx): Coin<PLP>` — deposit quote, get PLP shares (first depositor 1:1; else `amount*total/vault_value`). predict.move:437
- `withdraw<Quote>(predict: &mut Predict, lp_coin: Coin<PLP>, clock, ctx): Coin<Quote>` — burn PLP; capped at `balance − total_max_payout` and the withdrawal rate-limiter. predict.move:474

Reference PTB pattern (from `scripts/transactions/predict/deposit.ts:30`): `tx.moveCall({ target: '<pkg>::predict::supply', typeArguments: [DUSDC_TYPE], arguments: [tx.object(predictObjectID), coin, tx.object('0x6')] })`. dUSDC is obtained on testnet via `0x2::coin::mint` with the dUSDC treasury cap (`dusdcMint.ts`) — but that cap is admin-held, so end users get dUSDC via the token-request form (below), not direct mint.

Admin-only (`registry.move`, gated by `AdminCap`/`OracleSVICap` — NOT for a user product, but relevant for a local devnet harness): `create_predict`, `create_oracle(registry, predict, admin_cap, cap, underlying_asset: String, expiry: u64, min_strike: u64, tick_size: u64, ctx)` (registry.move:104), `create_oracle_cap`, `enable/disable_quote_asset`, `set_trading_paused`, `set_base_spread`, `set_min_spread`, `set_utilization_multiplier`, `set_min/max_ask_price`, `set_oracle_ask_bounds`, `set_max_total_exposure_pct`, withdrawal-limiter setters. Oracle price/SVI pushes (`oracle::update_prices`, `oracle::update_svi`, `oracle::activate`) require `OracleSVICap` (the "Block Scholes operator" key) — held by the off-chain oracle feed, not users.

### READ / QUERY surface (safe, no signing)

**On-chain getters** (call via devInspect or read object fields): `predict::get_trade_amounts(predict, oracle, key, quantity, clock) -> (mint_cost, redeem_payout)` (predict.move:199) and `get_range_trade_amounts` (predict.move:317) — the canonical quote preview. `ask_bounds(predict, oracle_id) -> (min,max)` (predict.move:212). Config getters: `trading_paused`, `base_spread`, `min_spread`, `utilization_multiplier`, `max_total_exposure_pct`, `accepted_quotes`, `available_withdrawal`. Vault getters: `balance`, `vault_value`, `total_mtm`, `total_max_payout`, `asset_balance<T>`. Oracle getters: `spot_price`, `forward_price`, `svi`, `expiry`, `settlement_price`, `is_settled`, `is_active`, `status(clock)`. Manager getters: `position(key)`, `range_position(key)`, `balance<T>()`, `owner()`. `oracle_config::build_curve(oracle, min_strike, max_strike) -> vector<CurvePoint{strike, up_price}>` is the on-chain probability curve sampler (oracle_config.move:228).

**Indexer REST API** (all GET, all live — verified returning real data). Route consts at `server.rs:41-69`:
| Path | Returns (verified live) |
|---|---|
| `/health`, `/` | health |
| `/status` | per-pipeline checkpoint lag (live: `max_checkpoint_lag:6`, `~1s`); pipelines incl. `position_minted`, `oracle_activated`, etc. |
| `/config` | `{predict_id, pricing, risk, trading_paused, quote_assets:["...dusdc::DUSDC"]}` |
| `/oracles` | array of markets: `{predict_id, oracle_id, oracle_cap_id, underlying_asset:"BTC", expiry, min_strike, tick_size, status:"active", activated_at, settlement_price, settled_at, created_checkpoint}` |
| `/oracles/:id/state` | `{oracle, latest_price, latest_svi}` combined |
| `/oracles/:id/prices` + `/prices/latest` | `{spot, forward, checkpoint, onchain_timestamp, ...}` |
| `/oracles/:id/svi` + `/svi/latest` | `{a, b, rho, rho_negative, m, m_negative, sigma, ...}` (signed params split into magnitude+bool) |
| `/oracles/:id/ask-bounds` | per-oracle bound override (null if none) |
| `/positions/minted`, `/positions/redeemed` | trade events (supports `?limit=`) |
| `/ranges/minted`, `/ranges/redeemed` | range trade events |
| `/trades/:oracle_id` | per-market trade tape |
| `/lp/supplies`, `/lp/withdrawals` | PLP flow events |
| `/managers` | manager-created events `{manager_id, owner, ...}` |
| `/managers/:id/positions`, `/positions/summary`, `/ranges` | per-user positions |
| `/managers/:id/summary` | `{balances[], trading_balance, open_exposure, redeemable_value, realized_pnl, unrealized_pnl, account_value, open_positions, awaiting_settlement_positions}` |
| `/managers/:id/pnl` | time-series `{range, series_type, points[], current_unrealized_pnl, current_total_pnl}` |
| `/predicts/:id/{quote-assets,state,oracles}` | protocol config |
| `/predicts/:id/vault/summary` | `{vault_balance, vault_value, total_mtm, total_max_payout, available_liquidity, available_withdrawal, plp_total_supply, plp_share_price, utilization, max_payout_utilization, net_deposits, total_supplied, total_withdrawn}` |
| `/predicts/:id/vault/performance` | vault perf time-series |

There is **no** `/openapi.json` or `/docs` (both 404). No leaderboard endpoint exists (404) — "leaderboards" would have to be derived from `/managers` + `/managers/:id/pnl`.

### Events (subscribe via Sui checkpoints for sub-second live updates)
`predict.move:50-164`: `PositionMinted`, `PositionRedeemed`, `RangeMinted`, `RangeRedeemed`, `Supplied`, `Withdrawn`, plus config events (`TradingPauseUpdated`, `PricingConfigUpdated`, `OracleAskBoundsSet/Cleared`, `RiskConfigUpdated`, `QuoteAssetEnabled/Disabled`). `oracle.move:38-66`: `OracleActivated`, `OracleSettled{settlement_price}`, `OraclePricesUpdated{spot,forward}`, `OracleSVIUpdated{a,b,rho,m,sigma}`. `predict_manager.move:23`: `PredictManagerCreated{manager_id,owner}`.

### The OracleSVI vol surface (the generative-UI centerpiece) — `oracle.move`
`OracleSVI` (one per underlying+expiry) holds `prices: PriceData{spot, forward}`, `svi: SVIParams{a, b, rho:i64, m:i64, sigma}`, `expiry`, `settlement_price: Option`, lifecycle `status`: 0 INACTIVE → 1 ACTIVE → 2 PENDING_SETTLEMENT → 3 SETTLED (oracle.move:28-34, status() at :290). Update cadence: prices ~1s, SVI ~10-20s (oracle.move:85,186). SVI → implied vol → binary probability is exact (`compute_nd2`, oracle.move:396-429):
- `k = ln(strike/forward)`
- total variance `w(k) = a + b·(rho·(k−m) + sqrt((k−m)² + sigma²))`
- `d2 = −((k + w/2)/sqrt(w))`; **UP price = N(d2)** (probability settlement > strike); **DOWN = 1 − UP** (parity invariant, oracle.move:345). Implied vol per strike = `sqrt(w(k)/T)`.
Live sample (oracle `0x945e...`, BTC, expiry 1781912700000): spot `63031786131263` (≈ $63,031.79 at 1e9), SVI `a:4047, b:698908, rho:-0.532807611, m:-0.001159863, sigma:0.001` (sigma at floor). Strike grid: `min_strike:50000000000000` ($50k), `tick_size:1000000000` ($1k).

### Rich data types for generative UI (cite the four the prompt asked for)
- **A market** = `OracleSVI` row: `{oracle_id, underlying_asset, expiry, status, spot, forward, strike grid (min_strike/tick_size), settlement_price}` (from `/oracles/:id/state`).
- **A vol-surface point** = `SVIParams{a,b,rho,m,sigma}` + a `CurvePoint{strike, up_price}` vector from `build_curve` (the probability smile across strikes for one expiry) (oracle_config.move:55, :228).
- **A position** = `MarketKey{oracle_id, expiry, strike, direction(UP/DOWN)}` (market_key.move:20) or `RangeKey{oracle_id, expiry, lower_strike, higher_strike}` (range_key.move:18) + quantity in the manager's `positions`/`range_positions` tables, enriched by `/managers/:id/summary` PnL fields.
- **PLP state** = `/predicts/:id/vault/summary` (`vault_value, total_mtm, total_max_payout, available_liquidity, plp_share_price, utilization, plp_total_supply`). Live: vault_balance `1017657849506` (~$1.018M dUSDC), `plp_share_price:1.00208`, utilization `0.14%`.

### Pricing model for quote/preview UI — `predict.move:817-887`
Live oracle quote: `up_price = N(d2)` from SVI; `spread = pricing_config.quote_spread_from_fair_price(fair, total_mtm, vault_balance)` (base_spread + utilization term); `up_ask = min(up_price+spread, 1)`, `up_bid = up_price−spread`; DOWN mirrors via `1 − up`. Range fair = `up(lower) − up(higher)`. Settled oracles return fair price with zero spread. Mints are priced against post-trade vault state (trader pays for the liability they add).

### Composability surface (live on mainnet per brief; testnet source present)
- **DeepBook spot** (`packages/deepbook/sources/pool.move`): `swap_exact_base_for_quote<B,Q>` (:248), `swap_exact_quote_for_base<B,Q>` (:300), `*_with_manager` variants, `swap_exact_quantity` (:349) — for routing dUSDC/other assets pre-trade.
- **deepbook_margin** (`packages/deepbook_margin/sources/`): `margin_manager::new<B,Q>` (:324), `deposit` (:417), `withdraw` (:458), `borrow_base`/`borrow_quote` (:558/602), `repay_base`/`repay_quote` (:647/669), `liquidate<B,Q,DebtAsset>` (:690); `margin_pool::supply<Asset>` (:292) / `withdraw<Asset>` (:335) / `borrow`/`repay`; `pool_proxy` for margin-account order placement (`place_limit_order`, `place_market_order`, etc.). Shared objects: `MarginPool`, `MarginManager`, `MarginRegistry` (docs deepbook-margin).
- **iron_bank / USDsui**: NO `iron_bank` package exists in this repo. The only "iron bank"-adjacent surface is the margin **USDSUI** pool (`scripts/config/constants.ts:59 usdSuiMarginPoolCapID`; `scripts/transactions/marginPrep.ts` registers a `SUI_USDSUI` pool). USDsui supply = `margin_pool::supply<USDSUI>`. Treat "iron_bank" as a deployed mainnet object (per brief) the margin layer composes with, not a Move package in this branch.

## Inferences

- **An MCP product must build Predict TX construction itself.** The published `@mysten/deepbook-v3` SDK (`/tmp/ts-sdks-study/packages/deepbook-v3`) has zero `predict` references — it covers spot + margin only. Predict writes go through raw `tx.moveCall` PTBs against the package (pattern proven in `scripts/transactions/predict/deposit.ts`). This is a differentiator opportunity: ship the first Predict TS/MCP client.
- **Clean read/sign split for the catalog**: READ tools wrap the indexer REST + on-chain devInspect getters (no key). SIGN tools are exactly the 8 user entrypoints (`create_manager`, `mint`, `redeem`, `redeem_permissionless`, `mint_range`, `redeem_range`, `supply`, `withdraw`) — each returns an unsigned PTB for the user's wallet.
- **Generative-UI primitives are first-class**: `build_curve` → a probability smile chart; `/oracles/:id/svi/latest` → a live vol-surface heatmap across the rolling sub-hour BTC expiries; `/predicts/:id/vault/summary` → an LP dashboard; `/managers/:id/{summary,pnl}` → a portfolio/PnL panel. Signed `rho`/`m` arrive pre-split as `{magnitude, *_negative:bool}` in the API (vs `i64::I64` on-chain) — generative UI should read the API form.
- **Keeper/bot lane**: `redeem_permissionless` + `compact_settled_oracle` are permissionless post-settlement, enabling an auto-settlement keeper. Vol-arb bots compare `N(d2)` (recomputed from SVI locally) vs `ask_bounds`/spread.

## Unknowns And Questions

- **dUSDC faucet form**: the docs reference a "DeepBook Predict Testnet token request form" but the exact `tally.so`/Google Form URL is NOT in the two doc pages I fetched or in the repo (WebFetch on design + contract-information both returned no link). Likely lives on the parent `docs.sui.io/onchain-finance/deepbook-predict/` index page or the blog post `blog.sui.io/introducing-deepbook-predict`. Needs a direct fetch of those two URLs to extract verbatim. (Workaround for local dev: the repo's `dusdcMint.ts` mints via the dUSDC treasury cap, but that cap is admin-held on the public testnet.)
- **`pricing`/`risk` are null in `/config` and `/predicts/:id/state`** live — the indexer hasn't backfilled those config snapshots, so current spread/risk params must be read on-chain via the getters, not the API.
- **No leaderboard endpoint** despite the brief mentioning leaderboards — must be derived client-side from `/managers` + `/managers/:id/pnl`.
- **deepbook_margin / iron_bank mainnet object IDs** not enumerated here (brief says composable surface is live on mainnet; this repo is testnet-focused). If the product composes margin/iron_bank, pull mainnet IDs from the deepbook-margin contract-information doc separately.
- The published SDK lacking Predict is asserted from the cloned `--depth 1` main of `ts-sdks` (today); Mysten could add it. Re-check `npm view @mysten/deepbook-v3` before building.

Key files (absolute): `/tmp/deepbookv3-study/packages/predict/sources/predict.move`, `.../oracle.move`, `.../oracle_config.move`, `.../predict_manager.move`, `.../registry.move`, `.../market_key/{market_key,range_key}.move`, `/tmp/deepbookv3-study/scripts/transactions/predict/deposit.ts`, `/tmp/deepbookv3-study/scripts/config/constants.ts`, `/tmp/deepbookv3-study/crates/predict-server/src/server.rs`.

Sources: [DeepBook Predict design](https://docs.sui.io/onchain-finance/deepbook-predict/design), [contract-information](https://docs.sui.io/onchain-finance/deepbook-predict/contract-information), [deepbook-margin](https://docs.sui.io/onchain-finance/deepbook-margin), [predict package @ predict-testnet-4-16](https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict), [Introducing DeepBook Predict](https://blog.sui.io/introducing-deepbook-predict/), live indexer `https://predict-server.testnet.mystenlabs.com`.