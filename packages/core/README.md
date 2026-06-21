# @deepbookie/core

The neutral, transport-free **tool registry** behind [DeepBookie](https://deepbookie.vercel.app) — one set of tools that lights up in MCP, a CLI, and a web app at once.

Each tool is a `ToolDef` with a zod schema. **Reads `execute`** (and return projected JSON); **writes have no `execute`** — they `build()` an **unsigned** Sui `Transaction` that you sign at the edge. The registry holds no key and never signs.

## Install

```bash
pnpm add @deepbookie/core @mysten/sui
```

## Usage

```ts
import { allTools, getToolsForAdapter, createContext } from '@deepbookie/core';

// 44 tools, each tagged with a `surface` ('predict' | 'spot') and `kind` ('read' | 'write').
console.log(allTools.map((t) => t.name));

const ctx = createContext({ network: 'testnet', sender: myAddress });

// Adapter view: { list, schema, read, build } — wire it into your transport.
const tools = getToolsForAdapter(allTools, ctx);

const markets = await tools.read('list_markets', {});       // reads run now
const unsignedTx = await tools.build('mint', { /* … */ });  // writes return a Transaction → you sign it
```

## What's inside

- **Predict tools** — markets, the odds curve, exact quotes, mint/redeem (binary + range), the PLP vault.
- **Spot tools** — pools, orderbook, swap quotes, limit/market orders, the BalanceManager, staking, governance.
- **`ToolContext`** — the chain client + sender (+ optional `managerId` / `balanceManagerId`), so the same tool builds the right tx server-side or in the browser.

Depends on [`@deepbookie/predict-client`](https://www.npmjs.com/package/@deepbookie/predict-client), `@mysten/deepbook-v3`, `@mysten/sui`, and `zod`.

## License

MIT
