import { Card } from '@/components/ui/Card';
import { formatUsd } from '@/lib/format';
import type { Vault } from '@/lib/bff/types';

export function VaultCard({ vault }: { vault: Vault }) {
  const util = Math.min(100, Math.max(0, Math.round(vault.utilization * 100)));
  return (
    <Card className="p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Pool value</div>
      <div className="mt-1 font-mono text-[24px] font-extrabold tabular-nums tracking-[-0.02em]">
        {formatUsd(vault.vaultValueUsd, 0)} <span className="text-[13px] font-medium text-faint">dUSDC</span>
      </div>
      <div className="mt-3 flex justify-between text-[11.5px]">
        <span className="text-faint">Utilization</span>
        <span className="font-mono font-semibold tabular-nums">{util}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-[#EDE9E0]">
        <div className="h-full rounded-pill bg-green" style={{ width: `${util}%` }} />
      </div>
      <div className="mt-3 flex justify-between border-t border-line pt-2.5 text-[12px]">
        <span className="text-[#7d7870]">Available liquidity</span>
        <span className="font-mono font-medium tabular-nums">{formatUsd(vault.availableLiquidityUsd, 0)}</span>
      </div>
      <div className="flex justify-between text-[12px]">
        <span className="text-[#7d7870]">Share price</span>
        <span className="font-mono font-medium tabular-nums">{vault.plpSharePrice.toFixed(4)}</span>
      </div>
    </Card>
  );
}
