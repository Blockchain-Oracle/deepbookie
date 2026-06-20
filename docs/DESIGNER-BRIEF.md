# DeepBookie — Designer Brief

> Hand this to a designer (human or AI prototyping tool) to produce a prototype. It specifies **what we are really building, every component, the exact real data each one receives, and every state** — so nothing has to be invented. Each field below is backed by a live protocol on Sui testnet; the mock data you design with should use these shapes and units, because the prototype's data contract is the one we'll wire to production.
>
> **What this brief does NOT do: dictate look and feel.** Color, typography, exact styling, and motion personality are **yours**. This document defines structure, content, real data, states, behavior, and hierarchy — not aesthetics. Where "treatment" is mentioned, the visual choice is the designer's.

---

## 1. What DeepBookie is

**An AI agent you *talk to* in order to bet on short-term price moves — and you sign every bet yourself, in your own wallet. The agent never holds a key or touches your funds.**

You chat with it ("will BTC be above $63k in the next half hour?"). It reads the live market, reasons about the right bet, and **renders the trade as interactive cards** — a clickable odds curve, a payoff, a receipt you sign. It runs on **DeepBook Predict**, a new prediction market on Sui. DeepBookie is the first usable interface for it. The name = DeepBook + "bookie" (the odds-maker), which is literally what it does: it prices bets off a real volatility model.

## 2. The one idea every screen must carry: **"The agent proposes. You sign. It holds no key."**

This is the trust story and the product's spine. The agent is smart but powerless — it can only *propose*. **You** authorize every action in your own wallet, seeing exactly what you sign and getting a real receipt. Every sign moment should feel deliberate and trustworthy — closer to approving a bank transfer than placing a casino bet. This is positioning, not palette: however you style it, the *signing* is the hero moment.

---

## 3. Surfaces

1. **The app** (headline) — a chat-to-sign single page: a conversation where the agent's messages include rich, live, interactive cards (odds, sign receipts, positions, vault). **Mobile is first-class.**
2. **The landing page** — marketing: the one idea, a 3-step "ask → see the odds → sign it yourself," the no-key trust story, a glimpse of the real odds curve, and the "works in any AI agent / your terminal too" durability angle. One primary CTA → launch app.

---

## 4. Primary journey (storyboard)

1. **Land** → marketing sells §2. CTA: *Launch app*.
2. **Connect wallet** (Sui, via wallet adapter) → show account chip + a **TESTNET** indicator.
3. **Funding** → if the user holds **0 dUSDC**, a friendly onboarding state: "you need test dUSDC to bet — get some →" (links out to the faucet). **Real and required**, not an error.
4. **Ask** → user types intent; agent replies in plain language **and** renders a market card (odds curve).
5. **Read the odds** → the odds curve shows P(price ≥ strike) across strikes; user **clicks a strike** → probability + breakeven + cost surface.
6. **Propose** → agent emits a **sign card / receipt** itemizing the exact bet.
7. **Sign** → user clicks Authorize → wallet pops → approves; card animates `awaiting → signing → settled`, stamps it, shows the on-chain **digest** + explorer link.
8. **Track** → positions / PnL update; user can **redeem** (another sign card) or let it settle at expiry.
9. **History** → on reload, the whole conversation — every card and its signed/cancelled status — **returns exactly as it was.**

Secondary (same components): **range bet** (bet a price *band* → payoff diagram) and **provide liquidity** (deposit to the vault → vault card + LP share).

---

## 5. Shared primitives & units (design mock data to these)

Real values are integers with fixed scaling. The designer must format these correctly so mocks look real.

| Kind | Format | To display | Example |
|---|---|---|---|
| **Price / strike / probability** | integer **scaled ×1e9** | divide by 1e9 | `spot 63422991834743` → **$63,422.99**; `up_price 500000000` → **0.50 = 50%** |
| **dUSDC amount** | integer, **6 decimals** | divide by 1e6 | `500000000` → **500.00 dUSDC** |
| **SUI amount** | integer, **9 decimals** | divide by 1e9 | `985065372` → **0.985 SUI** |
| **Timestamp** | epoch **milliseconds** | relative/countdown | `expiry 1781927100000` → "in 1h 47m" |
| **Address / object id / digest** | `0x…` hex | truncate `0x1234…cdef`, copyable; digests link to Suiscan testnet | |
| **Direction** | `UP` / `DOWN` | up vs down must be clearly distinguishable (treatment is yours) | |
| **Status** | `active` · `pending_settlement` · `settled` (· `inactive`) | a clear lifecycle indicator | |

---

## 6. Component catalog (exhaustive)

Design **every** component with **all** of these states: **loading (skeleton) · empty · error · live · past/persisted.** Two are bespoke heroes (⭐); the rest are reusable.

### 6.1 App shell + chat conversation
The container: message list + composer (text input, send, suggested prompts) + account chip.
- **Data in — `messages: Message[]`**, each `{ id, role: 'user' | 'assistant', parts: Part[] }`.
  - `Part` is either `{ type: 'text', text }` **or** `{ type: 'tool-<name>', toolCallId, state, input, output, errorText }`.
  - `state ∈ 'input-streaming' | 'input-available' | 'output-available' | 'output-error'`. Each tool part renders one of the cards below; `state` drives which sub-state shows (e.g. `input-available` → the actionable sign card; `output-available` → the signed/result card).
- **States:** streaming (assistant typing / tool card building) · empty (first run: hero prompt + suggestions) · error (a failed turn, retry) · normal.
- **Behavior:** auto-scroll, stop/regenerate, suggested-prompt chips, composer disabled while a sign is pending.

### 6.2 Wallet connect + account chip
- **Data in — `wallet`:** `{ connected: bool, address, walletName, walletIcon, chain: 'sui:testnet' }`.
- **States:** disconnected (Connect button) · connecting · connected (address chip + wallet logo + network badge) · wrong-network · error.
- The wallet's own logo on connect and on the sign card builds trust — include it.

### 6.3 Funding / balance (dUSDC onboarding)
- **Data in — `balances`:** `{ sui (9dp), dusdc (6dp) }`.
- **States:** loading · **empty (`dusdc === 0`) → onboarding card** ("get test dUSDC" + link) · funded (balance chip) · error. This empty state is part of the real flow — make it warm, not a dead end.

### 6.4 Market header / pill
- **Data in — `Market`** (GET `/oracles`, `/oracles/:id/state`): `{ oracle_id, underlying_asset: 'BTC', spot (×1e9), forward (×1e9), expiry (ms), status, min_strike (×1e9), tick_size (×1e9), settlement_price (×1e9 | null) }`.
- **Shows:** asset + logo, spot price, **live expiry countdown**, status. **States:** loading · live · settling · settled.

### 6.5 ⭐ Odds Curve (HERO)
The signature visual — makes an invisible volatility surface legible.
- **Data in:**
  - `Market` (6.4) for spot/forward/expiry/strike-grid.
  - `curve: CurvePoint[]` = `{ strike (×1e9), up_price (×1e9 = P(above), 0…1e9) }` — the probability "smile" across strikes (from on-chain `build_curve`). `DOWN = 1 − up_price`.
  - SVI params (GET `/oracles/:id/svi`): `{ a, b, sigma (×1e9 uint); rho, m (×1e9, with rho_negative, m_negative booleans for sign) }` — the model behind the curve (probability = N(d2) from these). The designer doesn't compute it; just know the curve is real and *moves every few seconds*.
- **Interactions:** hover a strike → tooltip (strike, P(up), P(down)); **click a strike → selects it** and reveals `{ strike, probabilityUp (0…1), breakeven price, cost }`. Marker for spot/forward. Toggle UP/DOWN view.
- **States:** loading (skeleton curve) · live (animating as prices update) · settled (collapses to the settlement outcome) · empty (no live market) · error.

### 6.6 Quote / Preview receipt
A lightweight dry-run before committing — the lighter sibling of the sign card.
- **Data in** (from `get_trade_amounts` → `(mint_cost, redeem_payout)` + derived): `{ quantity (6dp), cost / mint_cost (6dp), redeem_payout (6dp), impliedProbability (0…1), breakeven (×1e9), maxPayout (6dp) }`.
- **States:** loading (recomputing as inputs change) · ready · error.

### 6.7 ⭐ Sign Card / Receipt (HERO #2 — the trust moment)
What the user authorizes. Reused by **every** write action (~60% of all interactions).
- **Data in — `ProposedAction`:**
  - `kind: 'mint' | 'redeem' | 'mint_range' | 'redeem_range' | 'supply' | 'withdraw'`
  - `market: { underlying_asset, oracle_id, expiry (ms) }`
  - binary: `strike (×1e9)`, `direction: UP | DOWN` — OR range: `lower_strike, higher_strike (×1e9)` — OR liquidity: `(supply/withdraw amount)`
  - `quantity (6dp)`, `cost (6dp)`, `maxPayout (6dp)`, `impliedProbability (0…1)`, `breakeven (×1e9)`, optional `fees (6dp)`
  - `toolCallId` (joins to status), `unsignedTx` (opaque — never shown)
- **Result (after action) — `{ status, digest?, error? }`** where `status ∈ 'proposed' | 'signing' | 'signed' | 'cancelled' | 'failed'`.
- **States:** `proposed` (itemized, buttons **Authorize** / Cancel) → `signing` (wallet open, buttons disabled, progress) → `signed` (stamp, digest + explorer link, no buttons) · `cancelled` (void) · `failed` (error + retry). Plus loading and **past/persisted** (a finalized receipt re-rendered from history).
- Itemize everything the user is agreeing to. This is the component to make perfect.

### 6.8 Position & PnL card
- **Data in** (GET `/managers/:id/summary`, `/managers/:id/pnl`, `/managers/:id/positions`):
  - summary: `{ trading_balance, open_exposure, redeemable_value, realized_pnl, unrealized_pnl, account_value (all 6dp), open_positions, awaiting_settlement_positions (counts) }`, `balances: [{ quote_asset, amount }]`.
  - positions: `{ minted: [...], redeemed: [...] }` — each entry `{ oracle_id, strike (×1e9) | (lower,higher for range), direction, quantity (6dp), … }`.
  - pnl: `{ series_type, points: [{ timestamp_ms, value (6dp) }], current_unrealized_pnl, current_total_pnl }`.
- **Shows:** open bets (market, side, size, current value, unrealized PnL, time-to-expiry), a portfolio roll-up, and a PnL trend. A **redeem** action launches a sign card (6.7).
- **States:** loading · **empty (no positions — common at first)** · live · settled-awaiting-redeem · error.

### 6.9 Vault / liquidity card
- **Data in** (GET `/predicts/:id/vault/summary`, `/vault/performance`): `{ vault_value, available_liquidity, available_withdrawal, total_max_payout (6dp), plp_share_price (float ~1.002), plp_total_supply (6dp), utilization (0…1), max_payout_utilization (0…1) }`; performance `points: [{ timestamp_ms, share_price, vault_value }]`; plus the user's **LP share** `userPlpBalance (6dp)`.
- **Shows:** pool size, your share + value, share price, utilization, a share-price trend. **Supply/Withdraw** launch sign cards.
- **States:** loading · live · empty (no LP position) · error.

### 6.10 Payoff diagram (range bets)
- **Data in:** `RangeKey { oracle_id, expiry, lower_strike (×1e9), higher_strike (×1e9) }`, `quantity (6dp)`, `cost (6dp)`, `maxPayout (6dp)`.
- **Shows:** payoff vs. final price — flat $0, a band `(lower, higher]` that pays, flat $0 — with breakeven markers. Makes "bet a band" instantly legible.
- **States:** loading · ready · error.

### 6.11 Data table (markets / trades / leaderboard)
- **Markets:** the `/oracles` list (asset, strike grid, expiry, status).
- **Trades:** GET `/trades/:oracle_id` → trade events (side, strike, quantity, price, time, trader).
- **Leaderboard:** derived client-side from `/managers` + `/managers/:id/pnl` (no dedicated endpoint).
- **States:** loading (skeleton rows) · empty · populated · error. Sortable; still polished.

### 6.12 History (conversation + cards replay)
**This is a first-class feature — the user explicitly wants it.** Past conversations, including their rendered cards and outcomes, come back on reload.
- **Data in:** persisted `messages` (the same `parts[]` as 6.1) **+** a transaction record per signed action `{ toolCallId, status: 'proposed'|'signed'|'cancelled'|'failed', digest, resolvedAt }` joined by `toolCallId`.
- **Design the "past" state of every card:** a signed bet shows the SIGNED receipt (digest, no buttons); a cancelled one shows VOID; an odds card shows the market as it was. A conversation list / switcher to revisit past sessions.
- **States:** loading (restoring) · restored (interactive history) · empty (no past sessions) · error.

### 6.13 System feedback (toasts / banners)
- Transaction submitted / confirmed / failed; wrong-network banner; indexer-lag or network-error notice; copy-confirmation.
- **States:** info · success · error, auto-dismiss + manual.

---

## 7. Guardrails — what NOT to build

- ❌ **No margin / leverage / "maintainer" / admin anything.** Not available on testnet, not in this product. (Remove it if you saw it in earlier notes.)
- ❌ **No spot-DEX trading UI.** "Spot" appears only as a tiny optional helper (a BTC price reference or a fund-dUSDC shortcut) — never a trading screen.
- ❌ **No invented data, fields, charts, or features.** Every screen maps to a component + data shape above. If a value isn't defined here, it doesn't exist — don't fabricate it.
- ❌ **Don't bury** the no-key trust story or the sign receipt — they are the product.
- This is a precise financial instrument with a friendly face — position it as trustworthy, not as gambling.

## 8. What we'd love back

1. **Landing page** (desktop + mobile).
2. **App** key screens: connected/empty (needs dUSDC) · live market with the odds curve · sign card mid-flow · a settled/past conversation (history) · positions/PnL · vault.
3. The two **hero components** (odds curve, sign receipt), state-complete (loading/empty/error/live/past).
4. A **style foundation** of your own making — type scale, color tokens, spacing, motion principles, the receipt treatment. (Yours to define; we'll adopt it.)
5. Mobile-first throughout.

*Accuracy over completeness: build only what's specified here, with these data shapes — that's what makes the prototype drop straight into production.*
