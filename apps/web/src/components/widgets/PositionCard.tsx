import { Card } from '@/components/ui/Card';
import { DirBadge } from './kit';
import { formatCountdown, formatPct, formatUsd } from '@/lib/format';
import type { Position } from '@/lib/bff/types';

function Mini({ label, value, accent, right }: { label: string; value: string; accent?: boolean; right?: boolean }) {
  return (
    <div className={right ? 'text-right' : ''}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className={`mt-0.5 font-mono text-[14px] font-semibold tabular-nums ${accent ? 'text-green' : 'text-ink'}`}>{value}</div>
    </div>
  );
}

export function PositionCard({ position, settled }: { position: Position; settled?: boolean }) {
  return (
    <Card className="p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DirBadge direction={position.direction} />
          <span className="text-sm font-bold">${formatUsd(position.strikeUsd, 0)}</span>
        </div>
        <span className="font-mono text-[10.5px] text-muted">{settled ? 'settled' : formatCountdown(position.expiry)}</span>
      </div>
      <div className="flex justify-between">
        <Mini label="Size" value={formatUsd(position.quantityUsd)} />
        <Mini label="Cost" value={formatUsd(position.costUsd)} />
        <Mini label="Entry" value={formatPct(position.probabilityAtTrade)} right />
      </div>
    </Card>
  );
}
