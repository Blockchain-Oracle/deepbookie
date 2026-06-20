'use client';

import { ConnectModal, useCurrentAccount } from '@mysten/dapp-kit';
import { useBalances } from '@/lib/hooks/useBalances';
import { formatAddress, formatUsd } from '@/lib/format';

/** Wallet area: a compact on-brand Connect trigger (stock modal) or the connected account chip. */
export function WalletChip() {
  const account = useCurrentAccount();
  const { dusdc } = useBalances();

  if (!account) {
    return (
      <ConnectModal
        trigger={
          <button
            type="button"
            className="shrink-0 whitespace-nowrap rounded-card-in bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper transition hover:opacity-90"
          >
            Connect Wallet
          </button>
        }
      />
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-pill border border-line bg-card py-1 pl-1.5 pr-2.5">
      <span className="size-4 shrink-0 rounded-[4px] bg-wallet" />
      <span className="font-mono text-xs text-ink-soft">{formatAddress(account.address)}</span>
      <span className="hidden h-3.5 w-px bg-line sm:block" />
      <span className="hidden font-mono text-xs font-semibold tabular-nums sm:inline">
        {dusdc.data != null ? `${formatUsd(dusdc.data)} dUSDC` : '—'}
      </span>
    </div>
  );
}
