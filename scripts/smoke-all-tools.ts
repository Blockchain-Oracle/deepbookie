/**
 * Comprehensive smoke: exercise EVERY agent tool through the core registry against live testnet.
 * Reads execute (and we print what they return); writes BUILD an unsigned tx (no signing, no spend).
 * Prints a pass/fail table so nothing is left untested. Run: npx tsx scripts/smoke-all-tools.ts
 */
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { existsSync, readFileSync } from 'node:fs';
import { allTools, createContext, getToolsForAdapter } from '../packages/core/dist/index.js';

const INDEXER = 'https://predict-server.testnet.mystenlabs.com';
// A manager with real data (resolved live earlier) — used for portfolio/positions read coverage.
const READ_MANAGER = '0x99b20ae30ba4bdc19e8e0d7d54d8ce84e55452dbd6ae046d10b1f062b80cec07';
const ZERO = `0x${'0'.repeat(64)}`;

type Row = { tool: string; kind: 'read' | 'write'; ok: boolean; note: string };

async function main(): Promise<void> {
  // Sender = the de-risk wallet (holds dUSDC, so funding builds like `supply` exercise coin selection).
  let sender = ZERO;
  if (existsSync('.secrets/derisk-key.json')) {
    const { secretKey } = JSON.parse(readFileSync('.secrets/derisk-key.json', 'utf8')) as { secretKey: string };
    sender = Ed25519Keypair.fromSecretKey(secretKey).toSuiAddress();
  }
  let managerId = READ_MANAGER;
  try {
    const rows = (await (await fetch(`${INDEXER}/managers?owner=${sender}`)).json()) as { manager_id?: string }[];
    if (rows[0]?.manager_id) managerId = rows[0].manager_id;
  } catch {
    /* fall back to READ_MANAGER */
  }

  const ctx = createContext({ network: 'testnet', sender });
  ctx.managerId = managerId;
  const api = getToolsForAdapter(allTools, ctx);
  console.log(`sender ${sender.slice(0, 10)}… · manager ${managerId.slice(0, 10)}… · ${api.list().length} tools\n`);

  const markets = (await api.read('list_markets', {})) as { oracleId: string; status: string }[];
  const oracleId = (markets.find((m) => m.status === 'active') ?? markets[0]!).oracleId;
  const market = (await api.read('get_market', { oracleId })) as { forward: number | null; spot: number | null };
  const strike = Math.round(market.forward ?? market.spot ?? 63000);
  const [lo, hi] = [strike - 500, strike + 500];

  const out: Row[] = [];
  const snip = (o: unknown) => JSON.stringify(o).replace(/\s+/g, ' ').slice(0, 88);
  const emsg = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 88);

  const read = async (tool: string, args: Record<string, unknown>) => {
    try {
      out.push({ tool, kind: 'read', ok: true, note: snip(await api.read(tool, args)) });
    } catch (e) {
      out.push({ tool, kind: 'read', ok: false, note: emsg(e) });
    }
  };
  const build = async (tool: string, args: Record<string, unknown>) => {
    try {
      const tx = await api.build(tool, args);
      out.push({ tool, kind: 'write', ok: !!tx, note: 'unsigned tx built' });
    } catch (e) {
      out.push({ tool, kind: 'write', ok: false, note: emsg(e) });
    }
  };

  // --- READS (execute) ---
  await read('list_markets', {});
  await read('get_market', { oracleId });
  await read('get_odds', { oracleId });
  await read('get_quote', { oracleId, strikeUsd: strike, direction: 'UP', quantityUsd: 1 });
  await read('get_range_quote', { oracleId, lowerStrikeUsd: lo, higherStrikeUsd: hi, quantityUsd: 1 });
  await read('get_vault', {});
  await read('get_vault_history', {});
  await read('get_portfolio', { managerId: READ_MANAGER });
  await read('get_positions', { managerId: READ_MANAGER });
  await read('get_recent_bets', { limit: 5 });

  // --- WRITES (build unsigned tx only — no signing, no spend) ---
  await build('create_manager', {});
  await build('mint', { oracleId, strikeUsd: strike, direction: 'UP', quantityUsd: 1 });
  await build('redeem', { oracleId, strikeUsd: strike, direction: 'UP', quantityUsd: 1 });
  await build('mint_range', { oracleId, lowerStrikeUsd: lo, higherStrikeUsd: hi, quantityUsd: 1 });
  await build('redeem_range', { oracleId, lowerStrikeUsd: lo, higherStrikeUsd: hi, quantityUsd: 1 });
  await build('supply', { amountUsd: 1 });
  await build('withdraw', { plpCoinId: ZERO });

  console.log('TOOL                  KIND    OK  NOTE');
  for (const r of out) console.log(`${r.tool.padEnd(21)} ${r.kind.padEnd(6)} ${r.ok ? '✅' : '❌'}  ${r.note}`);
  const failed = out.filter((r) => !r.ok);
  console.log(`\n${out.length - failed.length}/${out.length} passed`);
  if (failed.length) {
    console.log('FAILED:', failed.map((f) => `${f.tool} (${f.note})`).join(' · '));
    process.exit(1);
  }
  console.log('✅ every tool exercised — nothing left behind');
}

main().catch((e) => {
  console.error('❌ harness', e);
  process.exit(1);
});
