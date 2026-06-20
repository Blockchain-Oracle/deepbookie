'use client';

import { Card } from '@/components/ui/Card';
import { DirBadge } from './kit';
import { RedeemButton } from './RedeemButton';
import { formatCountdown, formatPct, formatUsd } from '@/lib/format';
import type { Position } from '@/lib/bff/types';

const TH = 'text-[10px] font-semibold uppercase tracking-[0.1em] text-faint';

/** Open positions — desktop table + mobile cards; settled rows surface the inline Redeem action. */
export function PositionsTable({ positions, managerId }: { positions: Position[]; managerId: string }) {
  if (!positions.length) {
    return (
      <Card className="p-8 text-center text-sm text-muted">
        No open positions. Head to chat to place your first bet.
      </Card>
    );
  }
  const now = Date.now();

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="flex items-center bg-[#FAF8F3] px-5 py-3">
          <span className={`${TH} flex-[2.2]`}>Position</span>
          <span className={`${TH} flex-1 text-right`}>Size</span>
          <span className={`${TH} flex-1 text-right`}>Cost</span>
          <span className={`${TH} flex-1 text-right`}>Entry</span>
          <span className={`${TH} w-28 text-right`}>Status</span>
        </div>
        {positions.map((p, i) => (
          <div key={`${p.digest}-${i}`} className="flex items-center border-t border-line px-5 py-3.5">
            <div className="flex flex-[2.2] items-center gap-2.5">
              <DirBadge direction={p.direction} />
              <span className="text-[14px] font-bold">${formatUsd(p.strikeUsd, 0)}</span>
            </div>
            <span className="flex-1 text-right font-mono text-[13.5px] tabular-nums">{formatUsd(p.quantityUsd)}</span>
            <span className="flex-1 text-right font-mono text-[13.5px] tabular-nums">{formatUsd(p.costUsd)}</span>
            <span className="flex-1 text-right font-mono text-[13.5px] tabular-nums">{formatPct(p.probabilityAtTrade)}</span>
            <span className="flex w-28 items-center justify-end">
              {p.expiry <= now ? <RedeemButton position={p} managerId={managerId} /> : <ActivePill expiry={p.expiry} />}
            </span>
          </div>
        ))}
      </Card>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {positions.map((p, i) => {
          const settled = p.expiry <= now;
          return (
            <Card key={`${p.digest}-${i}`} className="p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DirBadge direction={p.direction} />
                  <span className="text-[14px] font-bold">${formatUsd(p.strikeUsd, 0)}</span>
                </div>
                {settled ? (
                  <RedeemButton position={p} managerId={managerId} />
                ) : (
                  <ActivePill expiry={p.expiry} />
                )}
              </div>
              <div className="flex justify-between">
                <Mini label="Size" value={formatUsd(p.quantityUsd)} />
                <Mini label="Cost" value={formatUsd(p.costUsd)} />
                <Mini label="Entry" value={formatPct(p.probabilityAtTrade)} right />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function ActivePill({ expiry }: { expiry: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-[11px] text-muted">{formatCountdown(expiry)}</span>
      <span className="rounded-pill border border-[#DCEAE2] bg-[#F4F7F4] px-2 py-0.5 font-mono text-[9.5px] font-semibold text-green">
        ACTIVE
      </span>
    </span>
  );
}

function Mini({ label, value, right }: { label: string; value: string; right?: boolean }) {
  return (
    <div className={right ? 'text-right' : ''}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}
