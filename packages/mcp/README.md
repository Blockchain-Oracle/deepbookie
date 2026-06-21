# @deepbookie/mcp

The [DeepBookie](https://deepbookie.vercel.app) **MCP server** (stdio) — trade **DeepBook** on Sui from Claude Desktop, Cursor, or any MCP client.

It exposes the full DeepBookie tool set (Predict prediction markets + Spot CLOB). Reads return live market data; **writes build an _unsigned_ transaction that a local key signs** — the server never asks the model for a key.

## Use it

Add to your MCP client config (e.g. Claude Desktop's `claude_desktop_config.json`):

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

## The signing key

The server resolves a key in this order:

1. **`DEEPBOOKIE_PRIVATE_KEY`** — a `suiprivkey…` secret key (recommended for MCP clients).
2. `~/.deepbookie/config.json` — a persisted key (mode `0600`).
3. **Auto-generate** one, persist it (`0600`), and log the address to fund.

This is the standard sign-at-the-edge model: the agent proposes, your key signs.

## Environment

| Variable | Purpose |
| --- | --- |
| `DEEPBOOKIE_PRIVATE_KEY` | Sui secret key (`suiprivkey…`) used to sign. |
| `DEEPBOOKIE_NETWORK` | `testnet` (default). |
| `DEEPBOOKIE_MANAGER_ID` | Optional — your Predict `PredictManager` (a shared object), to skip resolution. |
| `DEEPBOOKIE_BALANCE_MANAGER_ID` | Optional — your DeepBook `BalanceManager`. |
| `DEEPBOOKIE_LOG_LEVEL` | Pino level; logs go to **stderr** (stdout is the JSON-RPC channel). |

Runs on **Sui testnet**. Fund the key with testnet SUI (and dUSDC / DEEP for the relevant trades) before signing writes.

## License

MIT
