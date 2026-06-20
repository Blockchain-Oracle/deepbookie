import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { formatCountdown, formatUsd } from '@/lib/format';
import type { MarketState } from '@/lib/bff/types';

export function MarketHeader({ market }: { market: MarketState }) {
  const live = market.status === 'active';
  return (
    <Card className="flex items-center justify-between p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-[26px] items-center justify-center rounded-full bg-ink text-xs font-bold text-paper">₿</span>
        <div>
          <div className="text-sm font-bold">{market.asset}</div>
          <div className="font-mono text-xs text-muted">{market.spot != null ? `$${formatUsd(market.spot)}` : '—'}</div>
        </div>
      </div>
      {live ? (
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-green" />
          <span className="font-mono text-[10.5px] font-medium text-green">live · {formatCountdown(market.expiry)}</span>
        </span>
      ) : (
        <Pill>SETTLED</Pill>
      )}
    </Card>
  );
}
