'use client';

import { Card } from '@/components/ui/Card';
import { Sparkline } from '@/components/ui/Sparkline';
import { formatUsd } from '@/lib/format';
import type { Vault, VaultHistory } from '@/lib/bff/types';

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <Card className="p-4">
      <div className="mb-2 flex justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">{label}</span>
        <span className="font-mono text-[13px] font-bold tabular-nums">{Math.round(clamped)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-[#EDE9E0]">
        <div className="h-full rounded-pill" style={{ width: `${clamped}%`, background: color }} />
      </div>
    </Card>
  );
}

/** Liquidity-pool overview: value, share-price trend, utilization, available liquidity — all real BFF data. */
export function VaultPoolCard({ vault, history }: { vault: Vault; history?: VaultHistory }) {
  const series = history?.points.map((p) => p.sharePrice) ?? [];
  const first = series[0];
  const last = series[series.length - 1];
  const changePct = first && last ? ((last - first) / first) * 100 : 0;
  const maxPayoutUtil = vault.vaultValueUsd > 0 ? (vault.totalMaxPayoutUsd / vault.vaultValueUsd) * 100 : 0;
  const rangeLabel = (history?.range ?? '').toLowerCase() === 'all' ? 'all-time' : (history?.range ?? '');

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Pool value</div>
            <div className="mt-1 font-mono text-[30px] font-extrabold tabular-nums tracking-[-0.025em]">
              {formatUsd(vault.vaultValueUsd, 0)} <span className="text-[15px] font-medium text-faint">dUSDC</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Share price</div>
            <div className="mt-1 font-mono text-[18px] font-bold tabular-nums">{vault.plpSharePrice.toFixed(4)}</div>
          </div>
        </div>
        {series.length >= 2 && (
          <>
            <div className="mt-2">
              <Sparkline points={series} height={80} />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-faint">
              <span>share price</span>
              <span className={changePct >= 0 ? 'text-green' : 'text-clay'}>
                {changePct >= 0 ? '+' : ''}
                {changePct.toFixed(2)}% · {rangeLabel}
              </span>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Bar label="Utilization" pct={vault.utilization * 100} color="var(--color-green)" />
        <Bar label="Max-payout util." pct={maxPayoutUtil} color="#9c7a2a" />
      </div>

      <div className="flex gap-6 px-1">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Available liquidity</div>
          <div className="mt-1 font-mono text-[15px] font-bold tabular-nums">{formatUsd(vault.availableLiquidityUsd, 0)}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Total max payout</div>
          <div className="mt-1 font-mono text-[15px] font-bold tabular-nums">{formatUsd(vault.totalMaxPayoutUsd, 0)}</div>
        </div>
      </div>
    </div>
  );
}
