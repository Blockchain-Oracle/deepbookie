'use client';

import { BrandMark } from '@/components/ui/BrandMark';
import { WalletChip } from './WalletChip';

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-line bg-paper px-5 py-3">
      <div className="flex items-center gap-2.5">
        <BrandMark size={18} />
        <span className="font-bold tracking-[-0.03em]">DeepBookie</span>
        <span className="rounded-card-in border border-line-strong px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] text-muted">
          TESTNET
        </span>
      </div>
      <WalletChip />
    </header>
  );
}
