'use client';

import { useTxAction } from '@/lib/hooks/useTxAction';
import { SUISCAN_TX } from '@/lib/constants';
import type { Position } from '@/lib/bff/types';

/** Settle one binary position into the manager balance — the keyless sign flow as a single row action. */
export function RedeemButton({ position, managerId }: { position: Position; managerId: string }) {
  const { status, digest, reason, run } = useTxAction();

  if (status === 'done' && digest) {
    return (
      <a
        href={SUISCAN_TX(digest)}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-[11px] font-semibold text-green underline decoration-green/40 underline-offset-2"
      >
        Redeemed ↗
      </a>
    );
  }

  if (status === 'error') {
    return (
      <button
        type="button"
        title={reason ?? undefined}
        onClick={() => void run('redeem', toArgs(position), managerId)}
        className="rounded-[7px] border border-clay px-3 py-1.5 text-[12px] font-semibold text-clay transition hover:bg-clay/5"
      >
        Retry
      </button>
    );
  }

  const signing = status === 'signing';
  return (
    <button
      type="button"
      disabled={signing}
      onClick={() => void run('redeem', toArgs(position), managerId)}
      className="rounded-[7px] bg-green px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {signing ? 'Signing…' : 'Redeem →'}
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
