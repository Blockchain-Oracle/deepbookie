/**
 * @deepbookie/core — the neutral, transport-free tool registry.
 * Reads execute (indexer/devInspect); writes return unsigned Sui transactions.
 * Surfaces (MCP/CLI/web) inject a ToolContext and sign at the edge.
 */
export * from './tool.js';
export * from './context.js';
export * from './registry.js';
export * from './adapter.js';
export { resolveBalanceManagerIds } from './spot/resolve.js';
// Static testnet coin/pool catalogs (coinKey → { type, scalar, … }) — lets the UI read a wallet's
// coin balance from the KNOWN coin type, independent of any BalanceManager read.
export { SPOT_COINS, SPOT_POOLS } from './spot/constants.js';
