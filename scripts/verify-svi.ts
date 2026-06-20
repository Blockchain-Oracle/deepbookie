/**
 * Verify the client-side SVI probability against the on-chain quote.
 * For strikes around the forward, compares our upProbability(N(d2)) to the on-chain
 * `get_trade_amounts` ask (mint_cost / quantity). If they track, the ×1e9 scaling is correct.
 */
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import {
  CLOCK_OBJECT,
  PREDICT_OBJECT,
  PREDICT_PACKAGE,
  TARGET,
  getActiveOracles,
  getLatestSvi,
  getOracleState,
  upProbability,
} from '../packages/predict-client/src/index.ts';

const SENDER = '0xd8d64570daa6e62f032d6dbc67918b5ffc3edbbb6e0805b2830367f336083820';
const QTY = 1_000_000_000n; // 1e9 -> ask fraction = mint_cost / QTY

function decodeU64(bytes: number[]): bigint {
  let v = 0n;
  for (let i = 0; i < bytes.length; i++) v |= BigInt(bytes[i] ?? 0) << BigInt(8 * i);
  return v;
}

async function main(): Promise<void> {
  const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet') });
  const [oracle] = await getActiveOracles();
  if (!oracle) throw new Error('no active oracle');
  const state = await getOracleState(oracle.oracle_id);
  const svi = await getLatestSvi(oracle.oracle_id);
  const forward = state.latest_price!.forward;
  console.log('oracle', oracle.oracle_id, 'forward', forward, '($' + (forward / 1e9).toFixed(0) + ')');
  console.log('offset |   strike    | client P(up) | on-chain ask');

  const tick = oracle.tick_size; // ×1e9 per $1 step (tick_size = 1e9)
  const atm = Math.round(forward / tick) * tick;
  for (const dollars of [-200, -100, -50, -20, 0, 20, 50, 100, 200]) {
    const off = (dollars * tick) / forward;
    const strike = atm + dollars * tick;
    const tx = new Transaction();
    const key = tx.moveCall({
      target: TARGET.marketKeyUp,
      arguments: [tx.pure.address(oracle.oracle_id), tx.pure.u64(oracle.expiry), tx.pure.u64(strike)],
    });
    tx.moveCall({
      target: `${PREDICT_PACKAGE}::predict::get_trade_amounts`,
      arguments: [tx.object(PREDICT_OBJECT), tx.object(oracle.oracle_id), key, tx.pure.u64(QTY), tx.object(CLOCK_OBJECT)],
    });
    const res = await client.devInspectTransactionBlock({ sender: SENDER, transactionBlock: tx });
    const rv = res.results?.[1]?.returnValues;
    const clientP = upProbability(svi!, forward, strike);
    if (!rv || !rv[0]) {
      console.log(`${(off * 100).toFixed(1)}%`.padStart(6), '|', String(strike).padStart(11), '|', clientP.toFixed(4).padStart(12), '| (no quote:', res.error, ')');
      continue;
    }
    const askFraction = Number(decodeU64(rv[0][0])) / Number(QTY);
    console.log(
      `${(off * 100).toFixed(1)}%`.padStart(6),
      '|',
      String(strike).padStart(11),
      '|',
      clientP.toFixed(4).padStart(12),
      '|',
      askFraction.toFixed(4).padStart(12),
    );
  }
}

main().catch((e) => {
  console.error('ERROR', e);
  process.exit(1);
});
