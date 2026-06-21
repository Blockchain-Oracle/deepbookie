'use client';

import { BrandMark } from '@/components/ui/BrandMark';
import { WalletChip } from './WalletChip';

export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 md:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <BrandMark size={18} />
        <span className="truncate font-bold tracking-[-0.03em]">DeepBookie</span>
        <span className="hidden rounded-card-in border border-line-strong px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] text-muted sm:inline-block">
          TESTNET
        </span>
      </div>
      <WalletChip />
    </header>
  );
}
