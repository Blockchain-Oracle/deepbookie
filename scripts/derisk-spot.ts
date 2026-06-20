/**
 * Phase A gate: prove the DeepBook V3 spot read tools work against live testnet through our core
 * registry + ToolContext (the SDK client-compat question). Run: pnpm tsx scripts/derisk-spot.ts
 */
import { allTools, createContext, getToolsForAdapter } from '../packages/core/dist/index.js';

const POOL = 'SUI_DBUSDC';

async function main(): Promise<void> {
  const ctx = createContext({ network: 'testnet' });
  const api = getToolsForAdapter(allTools, ctx);

  const pools = await api.read('spot_list_pools', {});
  console.log('spot_list_pools:', JSON.stringify(pools));

  const mid = await api.read('spot_mid_price', { poolKey: POOL });
  console.log('spot_mid_price:', JSON.stringify(mid));

  const params = await api.read('spot_pool_params', { poolKey: POOL });
  console.log('spot_pool_params:', JSON.stringify(params));

  const quote = await api.read('spot_swap_quote', { poolKey: POOL, baseQuantity: 1 });
  console.log('spot_swap_quote (1 SUI):', JSON.stringify(quote));

  const book = await api.read('spot_orderbook', { poolKey: POOL, ticks: 3 });
  console.log('spot_orderbook:', JSON.stringify(book));

  console.log('\n✅ spot reads work against live testnet');
}

main().catch((e) => {
  console.error('❌ spot derisk failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
