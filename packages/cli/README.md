# @deepbookie/cli

The [DeepBookie](https://deepbookie.vercel.app) **command-line tool** — trade **DeepBook** on Sui from your terminal. The tool builds the transaction; **your local key signs it**.

## Use it

```bash
npx @deepbookie/cli wallet              # show the local address + SUI/dUSDC balances
npx @deepbookie/cli tools               # list every tool
npx @deepbookie/cli call list_markets   # call a read tool → prints JSON
npx @deepbookie/cli call get_odds '{"asset":"BTC"}'
```

Or install it globally:

```bash
npm i -g @deepbookie/cli
deepbookie tools
```

## Commands

| Command | Does |
| --- | --- |
| `wallet` | Print the local wallet address and balances. |
| `tools` | List all available tools (name + schema). |
| `call <tool> [json]` | Call any tool. **Reads** print data; **writes** build → sign with your local key → execute, and print the digest. |

Args are a JSON object: `deepbookie call mint '{"oracleId":"0x…","direction":"UP","amount":5}'`.

## The signing key

Resolved in this order:

1. **`DEEPBOOKIE_PRIVATE_KEY`** — a `suiprivkey…` secret key.
2. `~/.deepbookie/config.json` — a persisted key (mode `0600`).
3. **Auto-generate** one, persist it, and print the address to fund.

The agent only ever builds an unsigned transaction — nothing signs without your key.

## Environment

| Variable | Purpose |
| --- | --- |
| `DEEPBOOKIE_PRIVATE_KEY` | Sui secret key (`suiprivkey…`). |
| `DEEPBOOKIE_NETWORK` | `testnet` (default). |
| `DEEPBOOKIE_MANAGER_ID` / `DEEPBOOKIE_BALANCE_MANAGER_ID` | Optional — your Predict / DeepBook shared managers. |
| `DEEPBOOKIE_LOG_LEVEL` | Pino log level. |

Runs on **Sui testnet**. Fund the key before signing writes.

## License

MIT
