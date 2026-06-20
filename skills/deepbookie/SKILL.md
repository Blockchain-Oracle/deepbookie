---
name: deepbookie
description: Trade DeepBook Predict (Sui's expiry-based prediction market) — read live odds, place binary or price-band bets, and provide liquidity. Use when the user wants to bet on short-term BTC moves, check prediction-market odds, or manage Predict positions on Sui.
version: 0.0.1
---

# DeepBookie — DeepBook Predict trading

DeepBookie trades **DeepBook Predict** on Sui: bet whether BTC is above/below a strike at a short (sub-hour) expiry, priced off a live volatility surface. Every tool builds an **unsigned** transaction; your wallet signs it — the agent holds no key.

## When to use
- "What are the odds BTC is above $X soon?" → `get_odds` / `get_quote`
- "Bet $5 that BTC stays above $63k" → `mint`
- "Bet BTC lands between $63k and $64k" → `mint_range`
- "Show my positions / PnL" → `get_portfolio`
- "What's the vault / provide liquidity" → `get_vault` / `supply`

## When NOT to use
- Spot trading, swaps, or margin/leverage — DeepBookie is **Predict-only**.
- Mainnet — Predict is **testnet-only** right now.

## First-time setup
1. On first run the CLI/MCP auto-creates a local wallet (address printed to stderr). Fund it with testnet **SUI** (gas) and **dUSDC** (from the faucet — dUSDC is not swappable).
2. Run `create_manager` once to open your PredictManager account.

## Tools
| Intent | Tool | Key args |
|---|---|---|
| List active markets | `list_markets` | — |
| Market state (spot/forward/expiry) | `get_market` | oracleId |
| Probability smile (odds curve) | `get_odds` | oracleId |
| Exact cost/payout quote | `get_quote` | oracleId, strikeUsd, direction, quantityUsd |
| Vault / liquidity state | `get_vault` | — |
| Positions & PnL | `get_portfolio` | managerId? |
| Open account (one-time) | `create_manager` | — |
| Buy a binary UP/DOWN bet | `mint` | oracleId, strikeUsd, direction, quantityUsd, fundUsd? |
| Sell/settle a binary bet | `redeem` | oracleId, strikeUsd, direction, quantityUsd |
| Buy a price-band bet | `mint_range` | oracleId, lowerStrikeUsd, higherStrikeUsd, quantityUsd, fundUsd? |
| Sell/settle a band bet | `redeem_range` | oracleId, lowerStrikeUsd, higherStrikeUsd, quantityUsd |
| Provide liquidity | `supply` | amountUsd |
| Withdraw liquidity | `withdraw` | plpCoinId |
| Keeper: settle a settled position | `redeem_permissionless` | managerId, oracleId, strikeUsd, direction, quantityUsd |

## A typical flow
`create_manager` → `list_markets` → `get_odds` (pick a strike) → `get_quote` (confirm cost) → `mint` (fund + bet) → later `get_portfolio` → `redeem`.

## Surfaces
- **CLI:** `deepbookie call <tool> '<json-args>'`, plus `deepbookie wallet` and `deepbookie tools`.
- **MCP:** run `deepbookie-mcp` (stdio) and add it to any MCP client; all tools above are exposed.

Notes: strikes are **dollar** amounts (snapped to the market grid automatically); amounts are in **dUSDC**; reads are free, writes sign with your local key.
