# Designer Brief — Chat-home "Category Carousel"

> Hand-off brief for the DeepBookie chat home screen. Build to the existing design
> system (`Components.dc.html` for Predict, `Components-Spot.dc.html` for Spot).
> Deliverable at the bottom.

## What we're designing
The **chat home screen** of DeepBookie — what the user sees in the chat surface
**before they've sent a message** (today it's a brand mark + a row of plain text
chips). We want to replace that with a **horizontally-scrollable carousel of
CATEGORY cards**: a "here's what I can do" launcher. Tapping a card (or a prompt
inside it) **sends a starter prompt to the AI agent**, which then replies with the
real interactive widget (odds curve, swap card, receipt, etc.). The carousel is the
**entry point**, not the trade UI itself.

## Product context (so the cards ring true)
DeepBookie is an AI agent you *talk to* to trade on **DeepBook** (Sui). You ask in
plain language; the agent reads the live market and **proposes** an action as an
interactive card; **you sign every transaction in your own wallet** — the agent
holds no key. Two product families:
- **Predict** — an expiry-based prediction market: bet UP/DOWN that BTC is above/below
  a strike at a deadline; odds priced off a live volatility model. Lifecycle:
  bet → ongoing → settles at expiry → collect.
- **Spot (DeepBook V3 CLOB)** — swap tokens, place/modify/cancel limit orders (placing
  a maker order *is* providing liquidity — it's an order book, **not** an AMM, so
  **no APY/TVL/LP-pools**), stake DEEP for fee discounts + governance.

## The carousel — categories (each is one card; REAL features only)
Grounded in the actual tools — do not invent features. (Designer may merge/reorder.)
1. **Markets & odds** *(Predict)* — "See live BTC odds." Visual: a tiny probability-curve
   sparkline that ticks. Prompt: *"What are the live BTC odds right now?"*
2. **Place a bet** *(Predict)* — "Bet UP or DOWN, you sign it." Visual: UP/DOWN
   micro-motion. Prompt: *"Help me place a $5 UP bet on BTC."*
3. **Swap** *(Spot)* — "Swap tokens on DeepBook." Visual: the ⇅ swap glyph.
   Prompt: *"Swap 100 SUI to DBUSDC."*
4. **Orders & liquidity** *(Spot)* — "Place a limit order = provide liquidity." Visual:
   a 2-row depth ladder. Prompt: *"Place a limit buy for 250 SUI at 4.20."*
5. **Your account** *(Predict + Spot)* — "Balance, positions, PnL." Visual: a balance
   count-up. Prompt: *"What's my balance and open positions?"*
6. **Vault** *(Predict PLP)* — "Provide vault liquidity, earn the spread."
   Prompt: *"How does the vault work?"*
7. **Stake DEEP** *(Spot)* — "Stake for fee discounts + voting." Visual: the DEEP ◈ mark.
   Prompt: *"Stake 500 DEEP in the SUI/DBUSDC pool."*
8. **Governance** *(Spot)* — "Propose, vote, claim rebates."
   Prompt: *"Show governance for SUI/DBUSDC."*
9. **History** — "Replay your signed sessions." Visual: a receipt stub.
   Prompt: *"Show my recent sessions."*

## Card anatomy & states
- **Anatomy:** category color dot/icon · title (bold) · one-line description · a tappable
  starter-prompt line (`"…" →`) · optional tiny live visual motif.
- **States:** idle · hover/focus (lift + border-ink) · active/pressed · loading (if a card
  shows a live figure like odds/balance) · disabled (feature needs wallet/account — e.g.,
  Stake shows a subtle "connect to use").
- **Interaction:** tapping the card or its prompt **sends that prompt to the chat** (we
  wire it). Cards never execute a trade themselves.

## Creative direction (tasteful micro-motion — "not too boring, not too much")
A subtle, staggered entrance for the row; one small living detail per card (odds sparkline
tick, balance count-up, UP/DOWN pulse, ⇅ rotate on hover). Honor `prefers-reduced-motion`.
The vibe: a premium, calm "control surface," not a flashy dashboard.

## Layout & responsive
- A horizontal **scroll/snap carousel** (swipe on touch; subtle scrollbar/edge-fade on
  desktop). Cards a fixed width (~240–280px), 3–4 visible on desktop, snapping on
  mobile/tablet.
- Works at mobile (375), tablet (~820), desktop. Above the carousel: the brand mark + a
  one-line "Ask about a market, place a bet, or swap — you sign everything."

## Tokens (match the existing system EXACTLY)
ink `#1A1714` · paper `#F4F2EC` · canvas `#E4E2DC` · card `#FFFFFF` · green `#2C5E4A`
(up/buy/live) · clay `#B0452B` (down/sell) · mint `#7FCAA6` · wallet-blue `#4DA2FF`.
Fonts: **Schibsted Grotesk** (display/UI) + **IBM Plex Mono** (figures, tabular-nums).
Radii 8/14/99. Same chat-card language as the Predict (`Components.dc.html`) and Spot
(`Components-Spot.dc.html`) cards.

## Guardrails
Real tools only (no fictional features); Spot is a **CLOB, not an AMM** (no APY/LP-pool
cards); the carousel is a **launcher** that sends prompts (the real flows are the existing
odds/swap/receipt cards); keep each card ≤ the chat-card width family.

## Deliverable
A `.dc.html` export (same format as the others) of the **carousel row** + a single card in
its states (idle/hover/loading/disabled), so we can build it to spec.
