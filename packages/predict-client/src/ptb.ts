import { Transaction, type TransactionObjectArgument } from '@mysten/sui/transactions';
import { CLOCK_OBJECT, DUSDC_TYPE, PREDICT_OBJECT, TARGET } from './constants.js';
import type { Direction } from './types.js';

type Num = bigint | number;

/** Optional funding: split `depositAmount` (dUSDC base units) from a wallet coin and deposit it first. */
export interface Funding {
  fundCoinId: string;
  depositAmount: Num;
}

function fundManager(tx: Transaction, managerId: string, funding?: Funding): void {
  if (!funding) return;
  const [coin] = tx.splitCoins(tx.object(funding.fundCoinId), [tx.pure.u64(funding.depositAmount)]);
  tx.moveCall({
    target: TARGET.deposit,
    typeArguments: [DUSDC_TYPE],
    arguments: [tx.object(managerId), coin],
  });
}

function marketKey(
  tx: Transaction,
  oracleId: string,
  expiry: Num,
  strike: Num,
  direction: Direction,
): TransactionObjectArgument {
  return tx.moveCall({
    target: direction === 'UP' ? TARGET.marketKeyUp : TARGET.marketKeyDown,
    arguments: [tx.pure.address(oracleId), tx.pure.u64(expiry), tx.pure.u64(strike)],
  });
}

function rangeKey(
  tx: Transaction,
  oracleId: string,
  expiry: Num,
  lower: Num,
  higher: Num,
): TransactionObjectArgument {
  return tx.moveCall({
    target: TARGET.rangeKeyNew,
    arguments: [
      tx.pure.address(oracleId),
      tx.pure.u64(expiry),
      tx.pure.u64(lower),
      tx.pure.u64(higher),
    ],
  });
}

function callBinary(tx: Transaction, target: string, p: BinaryParams): void {
  const key = marketKey(tx, p.oracleId, p.expiry, p.strike, p.direction);
  tx.moveCall({
    target,
    typeArguments: [DUSDC_TYPE],
    arguments: [
      tx.object(PREDICT_OBJECT),
      tx.object(p.managerId),
      tx.object(p.oracleId),
      key,
      tx.pure.u64(p.quantity),
      tx.object(CLOCK_OBJECT),
    ],
  });
}

function callRange(tx: Transaction, target: string, p: RangeParams): void {
  const key = rangeKey(tx, p.oracleId, p.expiry, p.lowerStrike, p.higherStrike);
  tx.moveCall({
    target,
    typeArguments: [DUSDC_TYPE],
    arguments: [
      tx.object(PREDICT_OBJECT),
      tx.object(p.managerId),
      tx.object(p.oracleId),
      key,
      tx.pure.u64(p.quantity),
      tx.object(CLOCK_OBJECT),
    ],
  });
}

export interface BinaryParams {
  managerId: string;
  oracleId: string;
  expiry: Num;
  strike: Num;
  direction: Direction;
  quantity: Num;
}
export interface RangeParams {
  managerId: string;
  oracleId: string;
  expiry: Num;
  lowerStrike: Num;
  higherStrike: Num;
  quantity: Num;
}

/** create_manager — shares a new PredictManager for the signer. */
export function buildCreateManager(): Transaction {
  const tx = new Transaction();
  tx.moveCall({ target: TARGET.createManager });
  return tx;
}

/** mint — buy a binary UP/DOWN position (optionally funding the manager first). */
export function buildMint(p: BinaryParams & { funding?: Funding }): Transaction {
  const tx = new Transaction();
  fundManager(tx, p.managerId, p.funding);
  callBinary(tx, TARGET.mint, p);
  return tx;
}

/** redeem — sell/settle a binary position; payout lands in the manager balance. */
export function buildRedeem(p: BinaryParams): Transaction {
  const tx = new Transaction();
  callBinary(tx, TARGET.redeem, p);
  return tx;
}

/** redeem_permissionless — settle anyone's settled binary position (keeper). */
export function buildRedeemPermissionless(p: BinaryParams): Transaction {
  const tx = new Transaction();
  callBinary(tx, TARGET.redeemPermissionless, p);
  return tx;
}

/** mint_range — buy a vertical-range (price band) position. */
export function buildMintRange(p: RangeParams & { funding?: Funding }): Transaction {
  const tx = new Transaction();
  fundManager(tx, p.managerId, p.funding);
  callRange(tx, TARGET.mintRange, p);
  return tx;
}

/** redeem_range — sell/settle a range position. */
export function buildRedeemRange(p: RangeParams): Transaction {
  const tx = new Transaction();
  callRange(tx, TARGET.redeemRange, p);
  return tx;
}

/** supply — deposit a dUSDC coin into the vault, receive PLP (transferred to `recipient`). */
export function buildSupply(coinId: string, recipient: string): Transaction {
  const tx = new Transaction();
  const lp = tx.moveCall({
    target: TARGET.supply,
    typeArguments: [DUSDC_TYPE],
    arguments: [tx.object(PREDICT_OBJECT), tx.object(coinId), tx.object(CLOCK_OBJECT)],
  });
  tx.transferObjects([lp], tx.pure.address(recipient));
  return tx;
}

/** withdraw — burn a PLP coin, receive dUSDC (transferred to `recipient`). */
export function buildWithdraw(plpCoinId: string, recipient: string): Transaction {
  const tx = new Transaction();
  const out = tx.moveCall({
    target: TARGET.withdraw,
    typeArguments: [DUSDC_TYPE],
    arguments: [tx.object(PREDICT_OBJECT), tx.object(plpCoinId), tx.object(CLOCK_OBJECT)],
  });
  tx.transferObjects([out], tx.pure.address(recipient));
  return tx;
}
