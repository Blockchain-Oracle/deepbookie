import { Card } from '@/components/ui/Card';
import { DirBadge } from './kit';
import { formatUsd } from '@/lib/format';
import type { Position } from '@/lib/bff/types';

export function ActivityTape({ bets }: { bets: Position[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
        Recent bets
      </div>
      {bets.slice(0, 8).map((b, i) => (
        <div
          key={`${b.digest}-${i}`}
          className="flex items-center justify-between border-t border-line px-4 py-2.5 first:border-t-0"
        >
          <div className="flex items-center gap-2">
            <DirBadge direction={b.direction} />
            <span className="text-[13px] font-semibold">${formatUsd(b.strikeUsd, 0)}</span>
          </div>
          <span className="font-mono text-xs tabular-nums text-muted">
            {formatUsd(b.quantityUsd)} · {formatUsd(b.costUsd)} dUSDC
          </span>
        </div>
      ))}
    </Card>
  );
}
