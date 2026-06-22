import type { QueryClient } from '@tanstack/react-query';

/**
 * Client-side set of position keys the user has redeemed THIS session.
 *
 * The Predict indexer lags ~7s after a redeem, so a just-sold position keeps appearing in the
 * positions list. Each RedeemButton tracked its terminal state LOCALLY (useTxAction), which does NOT
 * survive a list refetch/reorder and does NOT span surfaces (a chat PositionCard and the Positions
 * page render independent buttons). So a sold position reverted to a clickable "Sell now" → the second
 * click MoveAborts (`predict_manager::decrease_position`, code 1) because the position no longer exists
 * on-chain. We mark the position here the instant ANY redeem succeeds (centrally, in useSubmitTx), and
 * every RedeemButton reads it — so the row goes terminal everywhere at once. Lives in the query cache
 * so it survives refetches and is shared across the whole app.
 */
export const REDEEMED_QK = ['predict', 'redeemed'] as const;

/** The fields that identify a redeemable position leg (binary or range). */
export interface RedeemableId {
  oracleId?: unknown;
  direction?: unknown;
  strikeUsd?: unknown;
  lowerStrikeUsd?: unknown;
  higherStrikeUsd?: unknown;
}

/**
 * Stable identity for a position across refetches/surfaces. The digest and array index aren't stable
 * (the indexer can re-key rows), but the market leg — oracle + direction + strike(s) — is.
 */
export function positionKey(p: RedeemableId): string {
  return [p.oracleId, p.direction, p.strikeUsd, p.lowerStrikeUsd, p.higherStrikeUsd]
    .map((v) => (v === undefined || v === null ? '' : String(v)))
    .join('|');
}

/** Mark a position redeemed so every RedeemButton goes terminal (idempotent). */
export function markRedeemed(qc: QueryClient, key: string): void {
  qc.setQueryData<Set<string>>(REDEEMED_QK, (prev) => new Set(prev ?? []).add(key));
}
