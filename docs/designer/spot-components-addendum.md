# Spot — Designer Brief ADDENDUM (new components for the expanded tool set)

This adds to the original spot Designer Brief (the 7 components: SpotPoolTable, SwapCard, OrderbookDepth, LimitOrderTicket, OpenOrdersList, BalanceManagerPanel + receipt line-items). After that brief, the spot tool set grew from 17 → **26 tools** (added: modify-order, staking, governance, settled-sweep, two pre-flight checks). Those need design coverage. **Same design system** — reuse every token/idiom from the original brief (ink `#1A1714`, paper `#F4F2EC`, green `#2C5E4A` buy/up, clay `#B0452B` sell/down, mint `#7FCAA6`; radii 8/14/999; Schibsted Grotesk + IBM Plex Mono tabular-nums; `Card`, `#FAF8F3` table headers, KV rows, the **SignReceipt** state machine).

## Where these render
**Inside the chat genUI** (the headline surface) — each is a tool-output widget the agent emits, signed via the existing receipt flow. There is **no dedicated `/spot` page in v1**. So design each as a **self-contained card** that sits in the chat stream (≤ ~430px wide, same as the Predict widgets), not as a full page section.

## Components to design

### 1. ModifyOrderCard — reduce an open order's size
The `spot_modify_order` tool. **IMPORTANT: modify can only *reduce* quantity** (new qty must be `< original` and `> filledQuantity`). To *increase*, the user cancels + places a new order — so the card's stepper/slider only goes **down** from the current quantity; show a hint "to increase, cancel & re-place."
- Data (from `spot_open_orders`): `{ orderId, isBid:boolean, price:number, quantity:number, filledQuantity:number }`.
- UI: order summary line (side badge buy/sell, price, current qty, a filled progress bar `filledQuantity/quantity`) + a **quantity stepper / slider** bounded `(filledQuantity, quantity]`, defaulting to current; an "Update order" CTA.
- States: idle, invalid (qty ≥ original or ≤ filled → disabled + reason), then SignReceipt (signing/signed+digest/failed).

### 2. StakeCard — stake / unstake DEEP
The `spot_stake` / `spot_unstake` tools. Staking DEEP into a pool earns fee discounts + governance voting power.
- Data (from `spot_account`): `{ poolKey, stake: { active:number, inactive:number } }`.
- UI: a stat row (Active stake, Inactive stake) + an amount input + two CTAs: **Stake** (amount) and **Unstake** (whole position, no amount). Small explainer: "Staked DEEP lowers your fees and lets you vote."
- States: not-connected / no-balance-manager (create first), idle, signing/signed/failed.

### 3. GovernanceCard — propose / vote / claim
Three tools: `spot_submit_proposal`, `spot_vote`, `spot_claim_rebates`. Design as **one card with three modes** (tabs or stacked sections):
- **Propose** (`submit_proposal`): inputs `takerFee`, `makerFee` (percent), `stakeRequired` (DEEP). Show current pool params alongside (from `spot_pool_params`: `takerFee/makerFee/stakeRequired`) for reference.
- **Vote** (`spot_vote`): input `proposalId`; CTA Vote (uses your staked DEEP weight).
- **Claim rebates** (`spot_claim_rebates`): show accrued rebates `{ base, quote, deep }` (from `spot_account.rebates`) + a Claim CTA (disabled when all zero).
- States: each action → SignReceipt; claim disabled when nothing to claim.

### 4. SettledSweepCard — sweep filled-order proceeds
The `spot_withdraw_settled_amounts` tool. After a limit order fills, the proceeds sit as **settled balances** in the pool until swept into the balance manager.
- Data: settled balances `{ base:number, quote:number, deep:number }` (the chat surfaces this from the account read). Show as a small banner: "You have unswept proceeds: 12.4 DBUSDC" + a **Sweep to balance manager** CTA. Hide entirely when all settled balances are zero.
- States: hidden (nothing settled) / actionable / signing / signed.

### 5. OrderValidityHint — pre-flight check (NOT a standalone card)
The `spot_can_place_limit_order` / `spot_can_place_market_order` reads return `{ canPlace:boolean }`. This is an **inline enhancement** to the existing LimitOrderTicket / SwapCard, not a new card: a small inline pill under the order inputs — green "✓ Order is valid" when `canPlace:true`, clay "✗ Can't place (insufficient balance or size)" when false, disabling the Place CTA. Design the two inline states only.

## Receipt line-items for the new write actions
These reuse the **SignReceipt** component (design copy only, not a new component) — title + 2–3 KV lines per action:
- **Reduce order** (`spot_modify_order`): title "Reduce order to {newQty}"; lines: Pair, Price, New size.
- **Stake** (`spot_stake`): title "Stake {amount} DEEP"; lines: Pool, New active stake.
- **Unstake** (`spot_unstake`): title "Unstake DEEP"; lines: Pool, Amount returned.
- **Submit proposal** (`spot_submit_proposal`): title "Propose fees {taker}/{maker}"; lines: Pool, Stake required.
- **Vote** (`spot_vote`): title "Vote on proposal"; lines: Pool, Proposal.
- **Claim rebates** (`spot_claim_rebates`): title "Claim rebates"; lines: Base, Quote, DEEP.
- **Sweep settled** (`spot_withdraw_settled_amounts`): title "Sweep settled proceeds"; lines: Pool, Amounts swept.

## Not designing
**Flash loans** — intentionally excluded (atomic single-PTB hot-potato; not a standalone agent tool). No component.
