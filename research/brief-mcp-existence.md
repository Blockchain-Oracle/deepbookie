I have exhaustive coverage. The `book` repo wraps Robinhood agentic + DeepBook Predict but is not an MCP server (no MCP files; it's an app). I have enough to write the definitive answer.

## Scope
Determine whether an **MCP server** already exists for DeepBook, DeepBook Predict, or Sui trading (the Sui Overflow DeepBook Predict track target), and survey precedent MCPs for other prediction markets / perps-DEXs with their signing models. Read-only research; external repos inspected via `gh`/web only.

## Sources Checked
- **Web search**: "DeepBook MCP", "DeepBook Predict MCP", "Sui MCP trading", Polymarket/Kalshi/Hyperliquid/Jupiter/dYdX/GMX MCP queries.
- **GitHub**: `gh search repos` for `DeepBook MCP`, `Sui MCP`, `deepbook predict`, `sui predict mcp`; `gh search code` for `deepbook`, `DeepBookClient`, `@mysten/deepbook-v3 @modelcontextprotocol`, `predict`; direct repo/file inspection.
- **MCP directories**: glama.ai (`glama.ai/mcp/servers?query=deepbook`), pulsemcp.com (`/servers?q=sui`), the **official MCP registry** (`registry.modelcontextprotocol.io/v0/servers?search=sui`), mcp.so (403), smithery.ai (via search), plus `buddies2705/awesome-perp-dex` MCP section.
- **Repos inspected directly**: `ExpertVagabond/sui-mcp-server` (README, `src/index.ts`, registry entry), `Jordan-Mysten/sui-mcp`, `tamago-labs/sui-mcp` (src tree), and the DeepBook-Predict hackathon repos (`deepbook-predict-cli`, `predictpilot`, `deepskew`, `updown`, `book`, `deepedge`, `Floe`).

## Verified Facts

**(a) DeepBook / Predict-specific MCP: NONE exists.**
- Zero GitHub repos match `deepbook mcp` or `sui predict mcp` (empty result sets). Source: `gh search repos`.
- The official MCP registry returns exactly one Sui server and explicitly "No servers specifically related to DeepBook." Source: `registry.modelcontextprotocol.io/v0/servers?search=sui`.
- No repo combines `@mysten/deepbook-v3` with `@modelcontextprotocol` (empty `gh search code`).
- All ~16 DeepBook **Predict** repos found (the Sui Overflow 2026 competitor set: `predictpilot`, `deepskew`, `updown`, `book`, `deepedge`, `Floe`, `deepbook-predict-cli`, `tidecast`, `predict-ops`, `capletfi`, `shadowbook`, etc.) are **terminals / bots / vaults / CLIs / Telegram apps — none is an MCP server**. `16abhimasani/book` ("agentic") has no MCP files (it's a Robinhood+Predict app); confirmed by listing repo contents.

**(b) General Sui MCP that already covers DeepBook: only a single read-only pool-query tool exists — no trading, no Predict.**
- **`ExpertVagabond/sui-mcp-server`** (v0.4.2, 53 tools, on Glama + official registry, last updated ~2026-06-05). It is the *only* Sui MCP that touches DeepBook. It has **exactly one** DeepBook tool: `deepbook_get_pool` — "Get DeepBook v3 pool info (order book) — mid price, spread, balances." It is **read-only** (`client.getObject` + dynamic fields), hardcoded to the **mainnet DeepBook v3** package `0x337f4f...482ef497`. **No order placement, no Predict, no testnet, no oracle/strike/expiry concepts.** Source: `src/index.ts:818-829, 1683-1690`; README "DeFi: DeepBook (1)".
- **`Jordan-Mysten/sui-mcp`** (`@jordangens/sui-mcp`, by a MystenLabs employee). Tools: balances, objects, transactions, and Move build/test/publish via local CLI. **No DeepBook, no trading.** Source: repo README.
- **`tamago-labs/sui-mcp`** (`@tamago-labs/sui-mcp`, 33+ tools). DeFi = **Scallop** lending + **Pyth** prices + staking. **No DeepBook** (confirmed: `gh search code deepbook` in repo returns nothing; src tree has no deepbook module). Source: README + `src/` listing.
- Other Sui MCPs (`abhinavg6/sui-mcp-server` 29 read tools over gRPC/GraphQL/archival; `StronglyTypedSoul`, `go-sui-mcp`, `dwong`, etc.) are data/wallet/ops servers — none expose DeepBook trading.

**(c) Precedent MCPs for prediction markets / perps-DEXs (with signing model):**

| Domain | MCP(s) | Trades or read-only? | Signing model |
|---|---|---|---|
| **Polymarket** | `pab1it0/polymarket-mcp`, `berlinbra/polymarket-mcp`, `TanmayDhobale/polymcp`, `guangxiangdebizi/PolyMarket-MCP`, `@iqai/mcp-polymarket` | Mostly **read-only** (Gamma markets, odds, order book, positions); some claim trade execution | Trading variants use **server-held key / API creds** in env |
| **Kalshi** | `yakub268/kalshi-mcp`, `alexandermazza/kalshi-trading-mcp` (20+ tools), `JamesANZ/prediction-market-mcp` | **Full trading** incl. limit orders (Kalshi); JamesANZ multi-market is read-only | **API key + private key in env** (server signs) |
| **Hyperliquid** | `edkdev/hyperliquid-mcp`, `Impa-Ventures/hyperliquid-mcp`, PlayAI, Alpha Arena | **Full trading** (place/cancel orders, positions) | **`HYPERLIQUID_PRIVATE_KEY` in env** — server signs, no human-in-loop |
| **Jupiter (Solana)** | `dcSpark/mcp-server-jupiter`, `quanghuynguyen1902/jupiter-mcp-server`, `araa47/jupiter-mcp`, `diaorui/jupiter-perps-mcp` | **Full trading** (quote → build → send swap) | **`SOLANA_PRIVATE_KEY` in env** — server signs |
| **GMX** | Official **GMX MCP** server announced as a transport over the GMX API; "agents hold their own keys" (non-custodial) | Trading | Agent-held key (non-custodial design) |
| **Bybit / generic** | `Bybit MCP` (247 tools), `wshobson/mcp-trader`, `metatrader-mcp-server` | Trading + analytics | API key / platform creds in env |

**Dominant precedent signing model = server-held private key or API key in an env var; the MCP signs autonomously.** A true "have the user sign each tx" (wallet-approval / unsigned-tx-returned) model is **not** the norm in any of the surveyed trading MCPs — this is an open differentiation lane.

## Inferences
- **The DeepBook Predict track has no MCP incumbent.** A DeepBook-Predict MCP (mint/redeem binary + vertical-range positions, vol-surface quotes, LP vault, testnet, sub-hour BTC oracles, the predict-server indexer as a data source) would be **first-of-kind** — no precedent on Sui and nothing in any directory.
- The only adjacent prior art (`deepbook_get_pool`) is a single mainnet spot read; building a Predict MCP does not overlap it.
- A **safer signing model than the precedent** (return unsigned PTBs for the user's wallet to approve, or scoped delegated/session keys instead of a raw hot key in env) would be a genuine differentiator versus the Polymarket/Kalshi/Hyperliquid/Jupiter "private-key-in-env" pattern — and aligns with the track's "have the user sign" framing.

## Unknowns And Questions
- mcp.so returned **403** to automated fetch; I relied on its search index via WebSearch (which surfaced only non-Sui results) and on glama/pulsemcp/official-registry instead. A manual browser pass on mcp.so + smithery.ai would close the last 5% — but three independent directories agree there is no DeepBook/Predict MCP.
- `Adwaitbytes/updown` MCP-file check hit a GitHub rate limit; its description ("Telegram-native binary options") indicates an app, not an MCP, but I could not 100% confirm absence of an MCP module.
- Whether any of the ~16 Predict hackathon repos *adds* an MCP wrapper before the Jun 21 deadline is unknowable now; as of this scan, none has one.

**Relevant local files:** none written (read-only task). Key external evidence: `github.com/ExpertVagabond/sui-mcp-server` `src/index.ts:818-829,1683-1690` (the lone DeepBook tool), `github.com/Jordan-Mysten/sui-mcp` README, `github.com/tamago-labs/sui-mcp` README.