import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { CLOCK_OBJECT, PREDICT_OBJECT, TARGET } from './constants.js';
import type { Direction } from './types.js';

type Num = bigint | number;

function decodeU64(bytes: number[]): bigint {
  let v = 0n;
  for (let i = 0; i < bytes.length; i++) v |= BigInt(bytes[i] ?? 0) << BigInt(8 * i);
  return v;
}

export interface TradeAmounts {
  /** dUSDC base units to BUY `quantity` of the position now. */
  mintCost: bigint;
  /** dUSDC base units received if you SELL `quantity` now. */
  redeemPayout: bigint;
}

/** Exact on-chain quote for a binary position (devInspect `get_trade_amounts`; no signing/gas). */
export async function getTradeAmounts(
  client: SuiJsonRpcClient,
  params: {
    oracleId: string;
    expiry: Num;
    strike: Num;
    direction: Direction;
    quantity: Num;
    sender: string;
  },
): Promise<TradeAmounts> {
  const tx = new Transaction();
  const key = tx.moveCall({
    target: params.direction === 'UP' ? TARGET.marketKeyUp : TARGET.marketKeyDown,
    arguments: [
      tx.pure.address(params.oracleId),
      tx.pure.u64(params.expiry),
      tx.pure.u64(params.strike),
    ],
  });
  tx.moveCall({
    target: TARGET.getTradeAmounts,
    arguments: [
      tx.object(PREDICT_OBJECT),
      tx.object(params.oracleId),
      key,
      tx.pure.u64(params.quantity),
      tx.object(CLOCK_OBJECT),
    ],
  });
  const res = await client.devInspectTransactionBlock({
    sender: params.sender,
    transactionBlock: tx,
  });
  const rv = res.results?.[1]?.returnValues;
  if (!rv || !rv[0] || !rv[1]) {
    throw new Error(`get_trade_amounts returned no quote (${res.error ?? 'unknown error'})`);
  }
  return { mintCost: decodeU64(rv[0][0]), redeemPayout: decodeU64(rv[1][0]) };
}
