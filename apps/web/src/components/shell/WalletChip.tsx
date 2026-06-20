'use client';

import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { useBalances } from '@/lib/hooks/useBalances';
import { formatAddress, formatUsd } from '@/lib/format';

export function WalletChip() {
  const account = useCurrentAccount();
  const { dusdc } = useBalances();

  if (!account) return <ConnectButton />;

  return (
    <div className="flex items-center gap-2 rounded-pill border border-line bg-card py-1 pl-1.5 pr-3">
      <span className="size-4 rounded-[4px] bg-wallet" />
      <span className="font-mono text-xs text-ink-soft">{formatAddress(account.address)}</span>
      <span className="h-3.5 w-px bg-line" />
      <span className="font-mono text-xs font-semibold tabular-nums">
        {dusdc.data != null ? `${formatUsd(dusdc.data)} dUSDC` : '—'}
      </span>
    </div>
  );
}
