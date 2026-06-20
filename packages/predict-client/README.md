# @deepbookie/predict-client

The first **DeepBook Predict** TypeScript client — for Sui's expiry-based, vol-surface-priced prediction market.

It is deliberately thin and **signing-agnostic**: it builds **unsigned** Sui transactions, reads the Predict indexer, and prices the SVI volatility surface. You sign the transactions however you like (a local keypair, or a browser wallet). Its only dependency is `@mysten/sui`.

## Install

```bash
pnpm add @deepbookie/predict-client @mysten/sui
```

## What's inside

- **Unsigned PTB builders** — `buildCreateManager`, `buildMint`, `buildRedeem`, `buildRedeemPermissionless`, `buildMintRange`, `buildRedeemRange`, `buildSupply`, `buildWithdraw`. Each returns a `Transaction` you sign at the edge.
- **Indexer readers** — `getActiveOracles`, `getOracleState`, `getLatestSvi`, `getVaultSummary`, `getManagerSummary`, `getManagerPnl`.
- **Vol-surface math** — `upProbability` / `downProbability` (UP = N(d2) from SVI) and `buildCurve` (the probability smile the UI renders).
- **Units** — `fromScaled`/`toScaled` (×1e9 fixed-point) and `fromDusdc`/`toDusdc` (6dp).

## Example — propose a binary bet

```ts
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import {
  buildMint,
  getActiveOracles,
  getOracleState,
  getLatestSvi,
  upProbability,
  toDusdc,
} from '@deepbookie/predict-client';

const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet') });

const [oracle] = await getActiveOracles();
const { latest_price } = await getOracleState(oracle.oracle_id);
const svi = await getLatestSvi(oracle.oracle_id);
const strike = Math.round(latest_price!.forward); // ATM
const probUp = upProbability(svi!, latest_price!.forward, strike);

// Build the UNSIGNED bet (funding the manager from a wallet dUSDC coin)
const tx = buildMint({
  managerId,
  oracleId: oracle.oracle_id,
  expiry: oracle.expiry,
  strike,
  direction: 'UP',
  quantity: 1_000_000n,
  funding: { fundCoinId, depositAmount: toDusdc(50) },
});
// ...then sign `tx` with a keypair (MCP/CLI) or a browser wallet (web).
```

> **Note:** `@mysten/sui` 2.x uses `SuiJsonRpcClient` + `getJsonRpcFullnodeUrl` from `@mysten/sui/jsonRpc`. Testnet IDs are provisional and will change at mainnet.

MIT.
