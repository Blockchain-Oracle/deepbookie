'use client';

import { useQuote } from './useQuote';
import type { Position } from '@/lib/bff/types';

export type PositionPhase = 'open' | 'settled';

export interface PositionValue {
  /** open = before expiry (sell early at live value); settled = expiry passed (collect or it's worth 0). */
  phase: PositionPhase;
  /** Live exit value (open) or settled payout (settled), from get_quote.redeemPayoutUsd; undefined while loading. */
  valueUsd: number | undefined;
  /** valueUsd − costUsd (unrealized for open, realized for settled). */
  pnlUsd: number | undefined;
  /** Settled only: did the bet win? (payout above dust). undefined when open or still loading. */
  won: boolean | undefined;
  isLoading: boolean;
}

const DUST_USD = 0.0001;

/**
 * The live economic state of a position. A Predict bet's exit/settlement value isn't on the position
 * row — it's priced on-chain (the same get_quote redeemPayout the receipt uses). Before expiry that's
 * the "sell now" value; after expiry it's the settled payout (≈ size if won, ~0 if lost). One hook so
 * the chat card, the desktop row, and the mobile card all show the same numbers.
 */
export function usePositionValue(position: Position): PositionValue {
  const phase: PositionPhase = position.expiry <= Date.now() ? 'settled' : 'open';
  const q = useQuote(
    {
      oracleId: position.oracleId,
      strikeUsd: position.strikeUsd,
      direction: position.direction,
      quantityUsd: position.quantityUsd,
    },
    // A settled bet's payout is fixed — long-stale it so a History list of settled rows doesn't keep
    // re-querying the chain; open positions still refresh at the default cadence.
    { staleTime: phase === 'settled' ? 5 * 60_000 : 5_000 },
  );
  const valueUsd = q.data?.redeemPayoutUsd;
  const pnlUsd = valueUsd === undefined ? undefined : valueUsd - position.costUsd;
  const won = phase === 'settled' && valueUsd !== undefined ? valueUsd > DUST_USD : undefined;
  return { phase, valueUsd, pnlUsd, won, isLoading: q.isLoading };
}
