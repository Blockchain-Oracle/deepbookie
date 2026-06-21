<p align="center">
  <img src="https://deepbookie.vercel.app/banner-wide.png" alt="DeepBookie" width="100%" />
</p>

<h1 align="center">DeepBookie</h1>

<p align="center">
  A chat app for trading <b>DeepBook</b> on Sui — describe a trade in plain English, DeepBookie builds it, <b>you sign every one in your own wallet</b>.
</p>

<p align="center">
  <a href="https://deepbookie.vercel.app"><b>Live app →</b></a> ·
  <a href="https://www.npmjs.com/package/@deepbookie/cli">CLI</a> ·
  <a href="https://www.npmjs.com/package/@deepbookie/mcp">MCP</a> ·
  <a href="https://www.npmjs.com/package/@deepbookie/predict-client">predict-client</a>
</p>

---

DeepBookie turns plain language into DeepBook trades across two product families:

- **Predict** — an expiry-based **binary prediction market**: bet UP/DOWN on whether BTC is above a strike at a deadline, with odds priced off a live volatility (SVI) surface.
- **Spot (DeepBook V3)** — a central limit **order book** (CLOB, not an AMM): swap tokens, place/modify/cancel limit orders (a maker order *is* liquidity), and stake DEEP for fee discounts + governance.

One shared tool registry powers **four surfaces** — a generative-UI web app, an MCP server, a CLI, and a Claude skill.

## The one invariant: sign at the edge

Every tool **builds an _unsigned_ Sui transaction**. The agent never holds a key and never moves funds. Signing happens wherever you are:

- **Web** — your browser wallet signs.
- **MCP / CLI** — a local key signs (`DEEPBOOKIE_PRIVATE_KEY`, or an auto-generated key in `~/.deepbookie/`).

If a tool can't move your money, a prompt-injected or buggy agent can't either.

## Packages

| Package | What it is |
| --- | --- |
| [`@deepbookie/predict-client`](packages/predict-client) | The first DeepBook **Predict** TypeScript client — unsigned PTB builders, indexer readers, SVI→N(d₂) math. Only depends on `@mysten/sui`. |
| [`@deepbookie/core`](packages/core) | The neutral, transport-free **tool registry** (44 tools). Reads `execute`; writes return an unsigned transaction. |
| [`@deepbookie/mcp`](packages/mcp) | An **MCP stdio server** — trade DeepBook from Claude Desktop, Cursor, or any MCP client. |
| [`@deepbookie/cli`](packages/cli) | A **terminal CLI** — the tool builds the tx, your local key signs it. |

## Quick start

### MCP (Claude Desktop / Cursor / any MCP client)

```jsonc
{
  "mcpServers": {
    "deepbookie": {
      "command": "npx",
      "args": ["-y", "@deepbookie/mcp"],
      "env": { "DEEPBOOKIE_PRIVATE_KEY": "suiprivkey1..." }
    }
  }
}
```

Omit `DEEPBOOKIE_PRIVATE_KEY` and the server generates a key on first run, saves it to `~/.deepbookie/config.json` (mode 0600), and tells you the address to fund.

### CLI

```bash
npx @deepbookie/cli tools                  # list every tool
npx @deepbookie/cli call list_markets      # live Predict markets
npx @deepbookie/cli call get_odds '{"asset":"BTC"}'   # the probability curve
```

### Skill (for Claude Code)

```bash
npx skills add Blockchain-Oracle/deepbookie --skill deepbookie
```

## Build from source

```bash
pnpm install
pnpm build      # all packages + the web app
pnpm typecheck
pnpm lint
pnpm test
```

The repo is a pnpm monorepo: `packages/*` (the SDK + adapters) and `apps/web` (the Next.js app, deployed to [deepbookie.vercel.app](https://deepbookie.vercel.app)).

## Network

DeepBookie runs on **Sui testnet** today. Predict is real (not mocked) — BTC binary markets priced off the live indexer + SVI surface. Spot uses DeepBook V3's testnet pools (DBUSDC, DEEP, SUI, DBTC, WAL …) via a per-user BalanceManager.

## License

MIT
