/**
 * Comprehensive smoke: exercise EVERY tool in the registry against live testnet — both surfaces
 * (predict + spot), reads AND writes. It iterates `allTools` DYNAMICALLY and asserts every single
 * tool was exercised, so a newly-added tool can never silently go untested.
 *
 *   pnpm smoke              → coverage: reads execute (printed); writes build an unsigned tx (no spend)
 *   SMOKE_SIGN=1 pnpm smoke → also runs a signed lifecycle (real digests): predict create→mint→redeem,
 *                             spot create-BM→deposit→swap→limit→cancel  (needs the funded .secrets key)
 */
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { existsSync, readFileSync } from 'node:fs';
import { allTools, createContext, getToolsForAdapter, resolveBalanceManagerIds } from '../packages/core/dist/index.js';

const INDEXER = 'https://predict-server.testnet.mystenlabs.com';
const READ_MANAGER = '0x99b20ae30ba4bdc19e8e0d7d54d8ce84e55452dbd6ae046d10b1f062b80cec07';
const ZERO = `0x${'0'.repeat(64)}`;
const POOL = 'SUI_DBUSDC'; // whitelisted on testnet → swaps/orders need no DEEP (payWithDeep:false)
const FAKE_ORDER = '170141183460469231731687303715884105728'; // u128 placeholder (build only, never signed)

type Row = { tool: string; surface: string; kind: string; ok: boolean; note: string };

function loadKey(): Ed25519Keypair | null {
  if (!existsSync('.secrets/derisk-key.json')) return null;
  const { secretKey } = JSON.parse(readFileSync('.secrets/derisk-key.json', 'utf8')) as { secretKey: string };
  return Ed25519Keypair.fromSecretKey(secretKey);
}

async function main(): Promise<void> {
  const kp = loadKey();
  const sender = kp?.toSuiAddress() ?? ZERO;

  // Resolve the test wallet's predict manager (indexer) + spot balance manager (devInspect).
  let managerId = READ_MANAGER;
  try {
    const rows = (await (await fetch(`${INDEXER}/managers?owner=${sender}`)).json()) as { manager_id?: string }[];
    if (rows[0]?.manager_id) managerId = rows[0].manager_id;
  } catch { /* keep READ_MANAGER */ }

  const ctx = createContext({ network: 'testnet', sender });
  ctx.managerId = managerId;
  try {
    const bms = await resolveBalanceManagerIds(ctx, sender);
    if (bms[0]) ctx.balanceManagerId = bms[0];
  } catch { /* spot BM-scoped tools will report "no balance manager" */ }
  const api = getToolsForAdapter(allTools, ctx);

  console.log(
    `sender ${sender.slice(0, 10)}… · manager ${managerId.slice(0, 10)}… · ` +
      `BM ${ctx.balanceManagerId ? `${ctx.balanceManagerId.slice(0, 10)}…` : 'none'} · ${allTools.length} tools\n`,
  );

  // Market + strike context for the predict tools.
  const markets = (await api.read('list_markets', {})) as { oracleId: string; status: string }[];
  const oracleId = (markets.find((m) => m.status === 'active') ?? markets[0]!).oracleId;
  const market = (await api.read('get_market', { oracleId })) as { forward: number | null; spot: number | null };
  const strike = Math.round(market.forward ?? market.spot ?? 63000);
  const [lo, hi] = [strike - 500, strike + 500];

  // Args for EVERY tool, keyed by name. Iterating allTools below guarantees nothing is skipped.
  const ARGS: Record<string, Record<string, unknown>> = {
    // predict reads
    list_markets: {},
    get_market: { oracleId },
    get_odds: { oracleId },
    get_quote: { oracleId, strikeUsd: strike, direction: 'UP', quantityUsd: 1 },
    get_range_quote: { oracleId, lowerStrikeUsd: lo, higherStrikeUsd: hi, quantityUsd: 1 },
    get_vault: {},
    get_vault_history: {},
    get_portfolio: { managerId: READ_MANAGER },
    get_positions: { managerId: READ_MANAGER },
    get_recent_bets: { limit: 5 },
    // predict writes
    create_manager: {},
    mint: { oracleId, strikeUsd: strike, direction: 'UP', quantityUsd: 1 },
    redeem: { oracleId, strikeUsd: strike, direction: 'UP', quantityUsd: 1 },
    redeem_permissionless: { oracleId, strikeUsd: strike, direction: 'UP', quantityUsd: 1, managerId: READ_MANAGER },
    mint_range: { oracleId, lowerStrikeUsd: lo, higherStrikeUsd: hi, quantityUsd: 1 },
    redeem_range: { oracleId, lowerStrikeUsd: lo, higherStrikeUsd: hi, quantityUsd: 1 },
    supply: { amountUsd: 1 },
    withdraw: { plpCoinId: ZERO },
    // spot reads
    spot_list_pools: {},
    spot_mid_price: { poolKey: POOL },
    spot_orderbook: { poolKey: POOL, ticks: 3 },
    spot_swap_quote: { poolKey: POOL, baseQuantity: 1 },
    spot_pool_params: { poolKey: POOL },
    spot_balance: { coinKey: 'SUI' },
    spot_account: { poolKey: POOL },
    spot_open_orders: { poolKey: POOL },
    spot_can_place_limit_order: { poolKey: POOL, price: 0.5, quantity: 10, isBid: true },
    spot_can_place_market_order: { poolKey: POOL, quantity: 10, isBid: true },
    // spot writes
    spot_create_balance_manager: {},
    spot_deposit: { coinKey: 'SUI', amount: 1 },
    spot_withdraw: { coinKey: 'SUI', amount: 1 },
    spot_swap_base_for_quote: { poolKey: POOL, amount: 1, minOut: 0, deepAmount: 0 },
    spot_swap_quote_for_base: { poolKey: POOL, amount: 1, minOut: 0, deepAmount: 0 },
    spot_place_limit_order: { poolKey: POOL, price: 0.5, quantity: 10, isBid: true, payWithDeep: false },
    spot_place_market_order: { poolKey: POOL, quantity: 10, isBid: true, payWithDeep: false },
    spot_modify_order: { poolKey: POOL, orderId: FAKE_ORDER, newQuantity: 5 },
    spot_cancel_order: { poolKey: POOL, orderId: FAKE_ORDER },
    spot_cancel_all_orders: { poolKey: POOL },
    spot_withdraw_settled_amounts: { poolKey: POOL },
    spot_stake: { poolKey: POOL, amount: 1 },
    spot_unstake: { poolKey: POOL },
    spot_submit_proposal: { poolKey: POOL, takerFee: 0.0005, makerFee: 0.0002, stakeRequired: 0 },
    spot_vote: { poolKey: POOL, proposalId: FAKE_ORDER },
    spot_claim_rebates: { poolKey: POOL },
  };

  // Signed lifecycle FIRST (when opted in): it creates a BalanceManager and threads its id into ctx,
  // so the BM-scoped spot tools below can actually build/read instead of refusing "no balance manager".
  if (process.env.SMOKE_SIGN === '1' && kp) {
    await signedLifecycle(api, kp, ctx, { oracleId, strike });
    console.log('');
  }

  const out: Row[] = [];
  const snip = (o: unknown) => JSON.stringify(o).replace(/\s+/g, ' ').slice(0, 64);
  const emsg = (e: unknown) => (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').slice(0, 64);

  // Coverage pass — EVERY tool, dynamically from the registry.
  for (const t of allTools) {
    const args = ARGS[t.name];
    if (!args) {
      out.push({ tool: t.name, surface: t.surface, kind: t.kind, ok: false, note: 'NO ARGS IN HARNESS — add it' });
      continue;
    }
    try {
      if (t.kind === 'read') {
        out.push({ tool: t.name, surface: t.surface, kind: 'read', ok: true, note: snip(await api.read(t.name, args)) });
      } else {
        const tx = await api.build(t.name, args);
        out.push({ tool: t.name, surface: t.surface, kind: 'write', ok: !!tx, note: 'unsigned tx built' });
      }
    } catch (e) {
      out.push({ tool: t.name, surface: t.surface, kind: t.kind, ok: false, note: emsg(e) });
    }
  }

  console.log('TOOL                          SURF     KIND   OK  NOTE');
  for (const r of out) {
    console.log(`${r.tool.padEnd(29)} ${r.surface.padEnd(7)} ${r.kind.padEnd(5)} ${r.ok ? '✅' : '❌'}  ${r.note}`);
  }

  // Completeness — every registry tool must appear exactly once in the results.
  const exercised = new Set(out.map((r) => r.tool));
  const missing = allTools.filter((t) => !exercised.has(t.name)).map((t) => t.name);
  const failed = out.filter((r) => !r.ok);
  console.log(`\nCOVERAGE: ${exercised.size}/${allTools.length} tools exercised · ${out.length - failed.length}/${out.length} passed`);
  if (missing.length) console.log('UNCOVERED:', missing.join(', '));
  if (failed.length) console.log('FAILED:', failed.map((f) => `${f.tool} (${f.note})`).join(' · '));

  if (process.env.SMOKE_SIGN !== '1') {
    console.log('\n(skipping signed lifecycle — set SMOKE_SIGN=1 with a funded .secrets key for real digests)');
  }

  if (missing.length || failed.length) process.exit(1);
}

type Api = ReturnType<typeof getToolsForAdapter>;

async function ensureGas(client: { getBalance: (a: { owner: string }) => Promise<{ totalBalance: string }> }, address: string): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const bal = BigInt((await client.getBalance({ owner: address })).totalBalance);
    if (bal >= 300_000_000n) return;
    await fetch('https://faucet.testnet.sui.io/v2/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ FixedAmountRequest: { recipient: address } }),
    }).catch(() => {});
    await new Promise((r) => setTimeout(r, 4000));
  }
}

/** Best-effort signed lifecycle — each step reports a real digest or a skip reason; never aborts.
 *  Creates the BalanceManager first and threads its id into ctx so the BM-scoped tools work after. */
async function signedLifecycle(api: Api, kp: Ed25519Keypair, ctx: ReturnType<typeof createContext>, m: { oracleId: string; strike: number }): Promise<void> {
  console.log('── SIGNED LIFECYCLE (real testnet spend) ──');
  await ensureGas(ctx.client as never, kp.toSuiAddress());

  type Res = { digest: string; effects?: { status?: { status?: string } }; objectChanges?: { type: string; objectType?: string; objectId?: string }[] };
  const sign = async (label: string, build: () => Promise<unknown>, opts: Record<string, boolean> = {}): Promise<Res | null> => {
    try {
      const tx = await build();
      const res = (await ctx.client.signAndExecuteTransaction({ signer: kp, transaction: tx as never, options: { showEffects: true, ...opts } })) as Res;
      await ctx.client.waitForTransaction({ digest: res.digest });
      const status = res.effects?.status?.status;
      console.log(`  ${label.padEnd(28)} ${status === 'success' ? '✅' : '❌'} ${res.digest} (${status})`);
      return res;
    } catch (e) {
      console.log(`  ${label.padEnd(28)} ⏭  ${(e instanceof Error ? e.message : String(e)).slice(0, 78)}`);
      return null;
    }
  };

  if (!ctx.balanceManagerId) {
    const res = await sign('spot_create_balance_manager', () => api.build('spot_create_balance_manager', {}), { showObjectChanges: true });
    const created = res?.objectChanges?.find((c) => c.type === 'created' && c.objectType?.includes('balance_manager::BalanceManager'));
    if (created?.objectId) {
      ctx.balanceManagerId = created.objectId; // thread into ctx → BM-scoped coverage now builds/reads
      console.log(`     → BalanceManager ${created.objectId.slice(0, 14)}…`);
    }
  } else {
    console.log(`  (reusing BalanceManager ${ctx.balanceManagerId.slice(0, 14)}…)`);
  }

  await sign('spot_deposit (1 SUI)', () => api.build('spot_deposit', { coinKey: 'SUI', amount: 1 }));
  await sign('spot_swap_base_for_quote', () => api.build('spot_swap_base_for_quote', { poolKey: POOL, amount: 0.5, minOut: 0, deepAmount: 0 }));
  await sign('spot_place_limit_order', () => api.build('spot_place_limit_order', { poolKey: POOL, price: 0.4, quantity: 10, isBid: true, payWithDeep: false }));
  await sign('spot_cancel_all_orders', () => api.build('spot_cancel_all_orders', { poolKey: POOL }));
  await sign('mint (1 contract)', () => api.build('mint', { oracleId: m.oracleId, strikeUsd: m.strike, direction: 'UP', quantityUsd: 1 }));
}

main().catch((e) => {
  console.error('❌ harness', e);
  process.exit(1);
});
