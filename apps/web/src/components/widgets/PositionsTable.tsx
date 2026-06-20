'use client';

import { Card } from '@/components/ui/Card';
import { DirBadge } from './kit';
import { RedeemButton } from './RedeemButton';
import { usePositionValue, type PositionValue } from '@/lib/hooks/usePositionValue';
import { formatCountdown, formatUsd } from '@/lib/format';
import type { Position } from '@/lib/bff/types';

const TH = 'text-[10px] font-semibold uppercase tracking-[0.1em] text-faint';

/**
 * Open positions, outcome-aware. Each row prices its live value (get_quote.redeemPayout): an open bet
 * shows its live exit value + unrealized PnL with a "Sell now" (early close) action; a settled bet
 * shows WON/LOST + realized PnL with a "Collect" action (a lost bet has nothing to collect).
 * Table on desktop, cards on tablet/mobile (defers to lg: so tablet isn't cramped).
 */
export function PositionsTable({ positions, managerId }: { positions: Position[]; managerId: string }) {
  if (!positions.length) {
    return (
      <Card className="p-8 text-center text-sm text-muted">
        No open positions. Head to chat to place your first bet.
      </Card>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden overflow-hidden p-0 lg:block">
        <div className="flex items-center bg-[#FAF8F3] px-5 py-3">
          <span className={`${TH} flex-[2.4]`}>Position</span>
          <span className={`${TH} flex-1 text-right`}>Size</span>
          <span className={`${TH} flex-1 text-right`}>Value</span>
          <span className={`${TH} flex-1 text-right`}>PnL</span>
          <span className={`${TH} w-24 text-right`}>Action</span>
        </div>
        {positions.map((p, i) => (
          <PositionRow key={`${p.digest}-${i}`} p={p} managerId={managerId} />
        ))}
      </Card>

      {/* Tablet + mobile cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {positions.map((p, i) => (
          <PositionMobileCard key={`${p.digest}-${i}`} p={p} managerId={managerId} />
        ))}
      </div>
    </>
  );
}

function PositionRow({ p, managerId }: { p: Position; managerId: string }) {
  const v = usePositionValue(p);
  const open = v.phase === 'open';
  return (
    <div className="flex items-center border-t border-line px-5 py-3.5">
      <div className="flex flex-[2.4] items-center gap-2.5">
        <DirBadge direction={p.direction} />
        <div>
          <div className="text-[14px] font-bold leading-none">${formatUsd(p.strikeUsd, 0)}</div>
          <div className="mt-1 font-mono text-[10.5px] text-muted">
            {open ? `${formatCountdown(p.expiry)} left` : <OutcomeTag won={v.won} />}
          </div>
        </div>
      </div>
      <span className="flex-1 text-right font-mono text-[13px] tabular-nums">{formatUsd(p.quantityUsd)}</span>
      <span className="flex-1 text-right font-mono text-[13px] tabular-nums">
        {v.valueUsd === undefined ? '…' : formatUsd(v.valueUsd)}
      </span>
      <span className="flex-1 text-right">
        <Pnl pnl={v.pnlUsd} />
      </span>
      <span className="flex w-24 items-center justify-end">
        <Action p={p} managerId={managerId} v={v} />
      </span>
    </div>
  );
}

function PositionMobileCard({ p, managerId }: { p: Position; managerId: string }) {
  const v = usePositionValue(p);
  const open = v.phase === 'open';
  return (
    <Card className="p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DirBadge direction={p.direction} />
          <span className="text-[14px] font-bold">${formatUsd(p.strikeUsd, 0)}</span>
          <span className="font-mono text-[10.5px] text-muted">
            {open ? `${formatCountdown(p.expiry)} left` : ''}
          </span>
          {!open && <OutcomeTag won={v.won} />}
        </div>
        <Action p={p} managerId={managerId} v={v} />
      </div>
      <div className="flex justify-between">
        <Mini label="Size" value={formatUsd(p.quantityUsd)} />
        <Mini label={open ? 'Value now' : 'Payout'} value={v.valueUsd === undefined ? '…' : formatUsd(v.valueUsd)} />
        <MiniPnl pnl={v.pnlUsd} />
      </div>
    </Card>
  );
}

/** Open → Sell now (ink). Settled win → Collect (green). Settled loss → nothing to collect. */
function Action({ p, managerId, v }: { p: Position; managerId: string; v: PositionValue }) {
  if (v.phase === 'open') return <RedeemButton position={p} managerId={managerId} label="Sell now" tone="ink" />;
  if (v.won === false) return <span className="font-mono text-[11px] text-faint">Lost</span>;
  return <RedeemButton position={p} managerId={managerId} label="Collect" tone="green" />;
}

function OutcomeTag({ won }: { won: boolean | undefined }) {
  if (won === undefined)
    return <span className="rounded-pill border border-line-strong px-1.5 py-0.5 text-[9px] font-semibold text-faint">SETTLED</span>;
  return won ? (
    <span className="rounded-pill border border-[#DCEAE2] bg-[#F4F7F4] px-1.5 py-0.5 text-[9px] font-semibold text-green">WON</span>
  ) : (
    <span className="rounded-pill border border-[#E6C9BE] bg-[#FBF1EC] px-1.5 py-0.5 text-[9px] font-semibold text-clay">LOST</span>
  );
}

function Pnl({ pnl }: { pnl: number | undefined }) {
  if (pnl === undefined) return <span className="font-mono text-[13px] text-faint">…</span>;
  const pos = pnl >= 0;
  return (
    <span className={`font-mono text-[13px] tabular-nums ${pos ? 'text-green' : 'text-clay'}`}>
      {pos ? '+' : '−'}
      {formatUsd(Math.abs(pnl))}
    </span>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function MiniPnl({ pnl }: { pnl: number | undefined }) {
  return (
    <div className="text-right">
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">PnL</div>
      <div className="mt-0.5">
        <Pnl pnl={pnl} />
      </div>
    </div>
  );
}
