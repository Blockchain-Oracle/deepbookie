'use client';

import { useQuery } from '@tanstack/react-query';
import { useTxAction } from '@/lib/hooks/useTxAction';
import { REDEEMED_QK, positionKey } from '@/lib/predict/redeemedStore';
import { SUISCAN_TX } from '@/lib/constants';
import type { Position } from '@/lib/bff/types';

const EMPTY_REDEEMED: Set<string> = new Set();
/** Proceeds note — the payout lands in the manager (account) balance, NOT the wallet, which is why a
 *  user's wallet balance looks unchanged after a sell. Surfaced as a tooltip on the terminal state. */
const PROCEEDS_NOTE = 'Proceeds were added to your account balance (not your wallet). Withdraw anytime.';

/**
 * The keyless redeem action as a single row button. `redeem` serves BOTH lifecycle exits:
 *  - open bet  → "Sell now" (close early at live value)
 *  - settled   → "Collect"  (claim the settled win; a lost bet redeems to 0)
 * The label is set by the caller from the position's phase.
 *
 * A sold position lingers in the list ~7s (indexer lag), so we read a SHARED redeemed-position store
 * (marked centrally on any redeem success in useSubmitTx) — once sold, the button goes terminal on
 * EVERY surface and refuses a second click, which would MoveAbort (decrease_position, code 1).
 */
export function RedeemButton({
  position,
  managerId,
  label = 'Collect',
  tone = 'green',
}: {
  position: Position;
  managerId: string;
  label?: string;
  tone?: 'green' | 'ink';
}) {
  const { status, digest, reason, run } = useTxAction();
  const redeemed = useQuery({
    queryKey: REDEEMED_QK,
    queryFn: () => EMPTY_REDEEMED,
    staleTime: Infinity,
    gcTime: Infinity,
  }).data;
  const sold = status === 'done' || (redeemed?.has(positionKey(position)) ?? false);
  const doneWord = label.toLowerCase().startsWith('collect') ? 'Collected' : 'Sold';

  if (sold) {
    const cls = 'font-mono text-[11px] font-semibold text-green';
    return digest ? (
      <a
        href={SUISCAN_TX(digest)}
        target="_blank"
        rel="noreferrer"
        title={PROCEEDS_NOTE}
        className={`${cls} underline decoration-green/40 underline-offset-2`}
      >
        {doneWord} ✓ ↗
      </a>
    ) : (
      <span title={PROCEEDS_NOTE} className={cls}>
        {doneWord} ✓
      </span>
    );
  }

  if (status === 'error') {
    return (
      <button
        type="button"
        title={reason ?? undefined}
        onClick={() => void run('redeem', toArgs(position), { managerId })}
        className="rounded-[7px] border border-clay px-3 py-1.5 text-[12px] font-semibold text-clay transition hover:bg-clay/5"
      >
        Retry
      </button>
    );
  }

  const signing = status === 'signing';
  const base = tone === 'ink' ? 'bg-ink text-paper' : 'bg-green text-white';
  return (
    <button
      type="button"
      disabled={signing}
      onClick={() => void run('redeem', toArgs(position), { managerId })}
      className={`rounded-[7px] px-3.5 py-1.5 text-[12px] font-semibold transition hover:opacity-90 disabled:opacity-60 ${base}`}
    >
      {signing ? 'Signing…' : `${label} →`}
    </button>
  );
}

function toArgs(p: Position): Record<string, unknown> {
  return {
    oracleId: p.oracleId,
    strikeUsd: p.strikeUsd,
    direction: p.direction,
    quantityUsd: p.quantityUsd,
  };
}
