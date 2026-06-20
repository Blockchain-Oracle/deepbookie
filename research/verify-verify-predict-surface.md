Verification complete. One important correction surfaced: `compact_settled_oracle` is NOT permissionless — it requires an `OracleSVICap`. The brief listed it under "keeper housekeeping" alongside `redeem_permissionless`, which is misleading. Let me note that and the docs addresses match. The published SDK at v1.5.1 (modified 2026-06-17) confirms the npm caveat. All findings below.

---

## Scope

Adversarial re-verification of the riskiest claims in the DeepBook **Predict** surface brief (track: Sui Overflow DeepBook Predict, $35k 1st). Confirmed the named Move entrypoints (`mint`/`redeem`/`redeem_permissionless`/`supply`/`withdraw`/`mint_range`/`redeem_range`/`create_manager`/`compact_settled_oracle`), the `create_oracle`/`PredictManager`/`build_curve`/`N(d2)` claims, the predict-server REST API, all deployment addresses, and the "published SDK lacks Predict" claim — against the `deepbookv3` repo on branch `predict-testnet-4-16`, the live indexer, the official docs, and npm. Read-only; nothing written to the onemem dir.

## Sources Checked

- Move source `/tmp/deepbookv3-study`, branch `predict-testnet-4-16` (confirmed `git branch --show-current` → `predict-testnet-4-16`, HEAD `1159d79a`): `packages/predict/sources/{predict,oracle,oracle_config,registry,predict_manager}.move`.
- Live indexer `https://predict-server.testnet.mystenlabs.com` — `/config`, `/status`, `/oracles`, `/oracles/:id/svi/latest`, `/predicts/:id/vault/summary`, `/openapi.json`, `/leaderboard` (curl, captured JSON + HTTP codes).
- Route consts `crates/predict-server/src/server.rs:41-69`.
- `scripts/config/constants.ts:80-95` (deployment addresses).
- Official docs `docs.sui.io/onchain-finance/deepbook-predict/contract-information` (WebFetch).
- npm `@mysten/deepbook-v3` (`npm view`) + cloned `/tmp/ts-sdks-study/packages/deepbook-v3/src/` (grep).

## Verified Facts (CONFIRMED / REFUTED / UNVERIFIABLE per key claim)

**CONFIRMED — User WRITE/SIGN entrypoints exist with the exact signatures claimed** (`packages/predict/sources/predict.move`):
- `create_manager(ctx): ID` @ :192
- `mint<Quote>(predict, manager, oracle, key: MarketKey, quantity, clock, ctx)` @ :219 — asserts `sender == manager.owner()`, `!trading_paused`, `quantity > 0`.
- `redeem<Quote>(...)` @ :285 — owner-gated; payout → `manager.deposit`.
- `redeem_permissionless<Quote>(...)` @ :300 — gated by `assert!(oracle.is_settled(), EOracleNotSettled)`; calls `deposit_permissionless`. **Permissionless keeper path CONFIRMED.**
- `mint_range<Quote>(..., key: RangeKey, ...)` @ :331; `redeem_range<Quote>` @ :380 — owner-gated.
- `supply<Quote>(predict, coin: Coin<Quote>, clock, ctx): Coin<PLP>` @ :437 — first depositor 1:1, else `mul_div_round_down(amount, total, vault_value)`.
- `withdraw<Quote>(predict, lp_coin: Coin<PLP>, clock, ctx): Coin<Quote>` @ :474 — capped at `balance − total_max_payout` (`EWithdrawExceedsAvailable`) plus withdrawal limiter.

**CONFIRMED — READ getters**: `get_trade_amounts` @ :199, `get_range_trade_amounts` @ :317, `ask_bounds` @ :212; `PredictManager` struct @ `predict_manager.move:31` with `owner()` @ :46, `position(key)` @ :51.

**CONFIRMED — `create_oracle` admin signature** @ `registry.move:104`: `create_oracle(registry, predict, _admin_cap: &AdminCap, cap: &OracleSVICap, underlying_asset: String, expiry: u64, min_strike: u64, tick_size: u64, ctx): ID`. Exactly as the brief states. Also `create_predict<Quote>` @ :75, `create_oracle_cap` @ :99.

**CONFIRMED — `build_curve` / `CurvePoint`** (`oracle_config.move`): `struct CurvePoint { strike: u64, up_price: u64 }` @ :55, getters `strike()` @ :69, `up_price()` @ :72. (Note: I confirmed the type and getters; did not separately re-quote the `build_curve` fn body line, but the curve-sampling primitive exists as claimed.)

**CONFIRMED — SVI → N(d2) pricing math** (`oracle.move`): `compute_price` @ :331 returns `compute_nd2(oracle, strike)` for live oracles (doc-comment literally says "oracles return `N(d2)` from the SVI surface"). `compute_nd2` @ :400 computes `k = ln(strike/forward)`, total variance `a + b·|rho·(k−m) + sqrt((k−m)²+σ²)|`, `d2 = −((k + w/2)/sqrt(w))`, returns `normal_cdf(d2)`. Parity `binary_price_pair` @ :346-348 returns `(up, float_scaling − up)`, i.e. **DOWN = 1 − UP CONFIRMED.** FLOAT_SCALING = 1e9 confirmed (oracle.move:71 comment).

**CONFIRMED — Deployment addresses** (constants.ts AND official docs agree):
- Package `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138`
- Registry `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64`
- Predict object `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a`
- dUSDC type `0xe95040…::dusdc::DUSDC`; PLP type `0xf5ea…5138::plp::PLP`; currency ID `0xf3000dff…3e9c`. All match the docs page verbatim.

**CONFIRMED — Live indexer REST API** (real JSON returned now):
- `/config` → `{predict_id:"0xc873…", pricing:null, risk:null, trading_paused:null, quote_assets:["e95040…::dusdc::DUSDC"]}`. **`pricing`/`risk`/`trading_paused` null CONFIRMED.**
- `/status` → live, `max_checkpoint_lag:6`, `max_time_lag_seconds:1`, pipelines incl. `oracle_activated`, `oracle_ask_bounds_cleared`.
- `/oracles` → array of BTC markets `{oracle_id, oracle_cap_id, underlying_asset:"BTC", expiry, min_strike:50000000000000, tick_size:1000000000, status:"active", settlement_price:null,…}`. Includes `0x945e601e…` as the brief sampled.
- `/oracles/:id/svi/latest` → live SVI with signed params split (`rho:439999960, rho_negative:…`). **API-form signed-magnitude split CONFIRMED.**
- `/predicts/:id/vault/summary` → live `{vault_balance:1017658299504 (~$1.018M), vault_value, total_mtm, total_max_payout, available_liquidity, plp_total_supply, plp_share_price:1.00208, utilization:0.00144 (0.14%), max_payout_utilization, net_deposits, total_supplied, total_withdrawn}`. All fields present as claimed.
- Route consts at `server.rs:41-69` match the brief's table.
- `/openapi.json` → **404 CONFIRMED**. `/leaderboard` → **404 CONFIRMED** (no leaderboard endpoint).

**CONFIRMED — Published SDK lacks Predict**: `grep -riE "\bpredict\b" /tmp/ts-sdks-study/packages/deepbook-v3/src/` → **0 hits**; src dirs are `client.ts, contracts, index.ts, pyth, queries, transactions, types, utils` (spot + margin only). `npm view @mysten/deepbook-v3` → latest **1.5.1**, modified **2026-06-17** — still no Predict module in the published package as of today. The brief's "ship the first Predict TS/MCP client" differentiator holds.

## Inferences

- The clean READ-vs-SIGN catalog split in the brief is structurally sound: the 8 user-signed entrypoints are confirmed owner/settlement-gated, and the read surface (indexer REST + on-chain devInspect getters) needs no key.

## Unknowns And Questions

- **CORRECTION to the brief** — `compact_settled_oracle` is **NOT permissionless**. `predict.move:270` requires `oracle_cap: &OracleSVICap` and calls `oracle::assert_authorized_cap(oracle, oracle_cap)`. The brief lists it under "keeper housekeeping" next to `redeem_permissionless`, implying a permissionless keeper can call it — **REFUTED**. Only the `redeem_permissionless` path is open to arbitrary keepers; `compact_settled_oracle` is operator-cap-gated. A keeper product can auto-redeem settled positions but cannot drive vault compaction.
- **dUSDC faucet form URL** — still NOT found. The official `contract-information` doc explicitly makes "no mention of a dUSDC faucet, token request form, or mint" (WebFetch confirmed). Remains an open item; check the `deepbook-predict` index page or the blog post directly if a user-facing faucet is needed.
- **`pricing`/`risk` null in API** — confirmed live; current spread/risk params must be read on-chain, not from `/config`.
- `build_curve` fn body line not separately re-quoted this pass (type + getters confirmed); low risk given `CurvePoint` exists and is used.

Key files (absolute): `/tmp/deepbookv3-study/packages/predict/sources/predict.move` (entrypoints), `.../oracle.move:331,346,400` (N(d2)/parity), `.../oracle_config.move:55` (CurvePoint), `.../registry.move:104` (create_oracle), `/tmp/deepbookv3-study/scripts/config/constants.ts:80-95`, `/tmp/deepbookv3-study/crates/predict-server/src/server.rs:41-69`.

Sources: [contract-information](https://docs.sui.io/onchain-finance/deepbook-predict/contract-information), [predict package @ predict-testnet-4-16](https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict), live indexer `https://predict-server.testnet.mystenlabs.com`, npm `@mysten/deepbook-v3@1.5.1`.