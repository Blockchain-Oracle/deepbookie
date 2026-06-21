'use client';

import { Card } from '@/components/ui/Card';
import { DirBadge } from './kit';
import { RedeemButton } from './RedeemButton';
import { usePositionValue } from '@/lib/hooks/usePositionValue';
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

/**
 * One position in chat. `settled` = a historical (already-redeemed) row — shown as a static record.
 * A live (minted) position prices its exit value: open → live value + unrealized PnL + a "Sell now"
 * action; settled-unredeemed → WON/LOST + "Collect". `managerId` enables the inline sign action.
 */
export function PositionCard({
  position,
  managerId,
  settled,
}: {
  position: Position;
  managerId?: string;
  settled?: boolean;
}) {
  const v = usePositionValue(position);

  // Historical (already redeemed) — a static record, no live value or action.
  if (settled) {
    return (
      <Card className="p-3.5 opacity-90">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DirBadge direction={position.direction} />
            <span className="text-sm font-bold">${formatUsd(position.strikeUsd, 0)}</span>
          </div>
          <span className="font-mono text-[10.5px] text-muted">redeemed</span>
        </div>
        <div className="flex justify-between">
          <Mini label="Size" value={formatUsd(position.quantityUsd)} />
          <Mini label="Cost" value={formatUsd(position.costUsd)} />
          <Mini label="Entry" value={formatPct(position.probabilityAtTrade)} right />
        </div>
      </Card>
    );
  }

  const open = v.phase === 'open';
  const pnl = v.pnlUsd;
  return (
    <Card className="p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DirBadge direction={position.direction} />
          <span className="text-sm font-bold">${formatUsd(position.strikeUsd, 0)}</span>
          <span className="font-mono text-[10.5px] text-muted">
            {open ? `${formatCountdown(position.expiry)} left` : v.won === false ? 'lost' : v.won ? 'won' : 'settled'}
          </span>
        </div>
        {managerId &&
          (open ? (
            <RedeemButton position={position} managerId={managerId} label="Sell now" tone="ink" />
          ) : v.won === false ? null : (
            <RedeemButton position={position} managerId={managerId} label="Collect" tone="green" />
          ))}
      </div>
      <div className="flex justify-between">
        <Mini label="Size" value={formatUsd(position.quantityUsd)} />
        <Mini
          label={open ? 'Value now' : 'Payout'}
          value={v.isError ? '—' : v.valueUsd === undefined ? '…' : formatUsd(v.valueUsd)}
        />
        <Mini
          label="PnL"
          value={v.isError ? '—' : pnl === undefined ? '…' : `${pnl >= 0 ? '+' : '−'}${formatUsd(Math.abs(pnl))}`}
          accent={!v.isError && pnl !== undefined && pnl >= 0}
          right
        />
      </div>
    </Card>
  );
}
