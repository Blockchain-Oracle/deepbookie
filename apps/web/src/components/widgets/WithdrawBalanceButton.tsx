'use client';

import { useTxAction } from '@/lib/hooks/useTxAction';
import { SUISCAN_TX } from '@/lib/constants';
import { formatUsd } from '@/lib/format';

/**
 * Cash out: move the manager's free trading balance (where sell/redeem proceeds land) back to the
 * wallet via the `withdraw_balance` tool (predict_manager::withdraw → Coin → wallet). Without this, a
 * user could sell a bet but had no way to get the dUSDC out of the manager account.
 */
export function WithdrawBalanceButton({ managerId, balanceUsd }: { managerId: string; balanceUsd: number }) {
  const { status, digest, reason, run } = useTxAction();
  const go = () => void run('withdraw_balance', { amountUsd: balanceUsd }, { managerId });

  // Nothing withdrawable and no attempt in flight → don't show the control at all.
  if (balanceUsd <= 0 && status === 'idle') return null;

  if (status === 'done' && digest) {
    return (
      <a
        href={SUISCAN_TX(digest)}
        target="_blank"
        rel="noreferrer"
        title="Sent to your wallet."
        className="inline-flex items-center gap-1 rounded-[9px] border border-line bg-card px-3.5 py-2 text-[12.5px] font-semibold text-green transition hover:bg-paper"
      >
        Cashed out to wallet ✓ ↗
      </a>
    );
  }

  const signing = status === 'signing';
  const failed = status === 'error';
  return (
    <button
      type="button"
      onClick={go}
      disabled={signing}
      title={failed ? (reason ?? undefined) : undefined}
      className={`inline-flex items-center gap-1 rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${
        failed ? 'border border-clay text-clay hover:bg-clay/5' : 'bg-ink text-paper'
      }`}
    >
      {signing
        ? 'Signing…'
        : failed
          ? 'Retry cash-out'
          : `Cash out ${formatUsd(balanceUsd)} dUSDC to wallet`}
    </button>
  );
}
