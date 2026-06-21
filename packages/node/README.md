# @deepbookie/node

The Node-only signing layer for [DeepBookie](https://deepbookie.vercel.app) — it takes the **unsigned** transactions built by [`@deepbookie/core`](https://www.npmjs.com/package/@deepbookie/core) and signs + executes them with a local key. Used by [`@deepbookie/mcp`](https://www.npmjs.com/package/@deepbookie/mcp) and [`@deepbookie/cli`](https://www.npmjs.com/package/@deepbookie/cli).

This is the **edge** in "sign at the edge": the agent/registry never holds a key — this package does, on the machine the operator controls.

## Install

```bash
pnpm add @deepbookie/node @mysten/sui
```

## What's inside

- **`getOrCreateKeypair()`** — resolves a signer in order: `DEEPBOOKIE_PRIVATE_KEY` (a `suiprivkey…` secret) → `~/.deepbookie/config.json` (persisted, mode `0600`) → auto-generate, persist, and warn you to fund the new address.
- **`signAndExecute(client, keypair, tx)`** — sign an unsigned `Transaction`, execute it, wait for finality, return the result (digest + effects).
- **`logger`** — a Pino logger (writes to stderr, so it never corrupts an MCP stdio JSON-RPC channel).

## Example

```ts
import { getOrCreateKeypair, signAndExecute } from '@deepbookie/node';
import { allTools, getToolsForAdapter, createContext } from '@deepbookie/core';

const kp = getOrCreateKeypair();
const ctx = createContext({ network: 'testnet', sender: kp.toSuiAddress() });
const api = getToolsForAdapter(allTools, ctx);

const unsignedTx = await api.build('mint', { oracleId: '0x…', strikeUsd: 63000, direction: 'UP', quantityUsd: 5 });
const res = await signAndExecute(ctx.client, kp, unsignedTx); // your key signs — never the agent
console.log(res.digest);
```

Runs on **Sui testnet** by default (`DEEPBOOKIE_NETWORK`).

## License

MIT
