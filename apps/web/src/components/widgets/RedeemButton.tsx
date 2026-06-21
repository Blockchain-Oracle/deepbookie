'use client';

import { useTxAction } from '@/lib/hooks/useTxAction';
import { SUISCAN_TX } from '@/lib/constants';
import type { Position } from '@/lib/bff/types';

/**
 * The keyless redeem action as a single row button. `redeem` serves BOTH lifecycle exits:
 *  - open bet  → "Sell now" (close early at live value)
 *  - settled   → "Collect"  (claim the settled win; a lost bet redeems to 0)
 * The label is set by the caller from the position's phase.
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

  if (status === 'done' && digest) {
    return (
      <a
        href={SUISCAN_TX(digest)}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-[11px] font-semibold text-green underline decoration-green/40 underline-offset-2"
      >
        Done ↗
      </a>
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
