import { formatUsd } from '@/lib/format';
import type { Portfolio } from '@/lib/bff/types';

function Stat({ label, value, mint }: { label: string; value: string; mint?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a857b]">{label}</div>
      <div className={`mt-0.5 font-mono text-[15px] font-bold tabular-nums ${mint ? 'text-mint' : 'text-paper'}`}>{value}</div>
    </div>
  );
}

const signed = (n: number) => `${n >= 0 ? '+' : ''}${formatUsd(n)}`;

export function PortfolioRollup({ portfolio }: { portfolio: Portfolio }) {
  return (
    <div className="rounded-card bg-ink p-4 text-paper">
      <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8a857b]">Account value</div>
      <div className="mt-1 font-mono text-[28px] font-extrabold tabular-nums tracking-[-0.02em]">
        {formatUsd(portfolio.accountValueUsd)} <span className="text-[15px] font-medium text-[#a8a298]">dUSDC</span>
      </div>
      <div className="mt-3 flex gap-6">
        <Stat label="Unrealized" value={signed(portfolio.unrealizedPnlUsd)} mint={portfolio.unrealizedPnlUsd >= 0} />
        <Stat label="Exposure" value={formatUsd(portfolio.openExposureUsd)} />
        <Stat label="Realized" value={signed(portfolio.realizedPnlUsd)} />
      </div>
    </div>
  );
}
