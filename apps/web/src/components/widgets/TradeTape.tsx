'use client';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { DirBadge } from './kit';
import { SUISCAN_TX } from '@/lib/constants';
import { formatAddress, formatUsd } from '@/lib/format';
import type { Position } from '@/lib/bff/types';

/** Live tape of recent trades on one market — direction/strike/size/cost + the trader's address. */
export function TradeTape({ trades, loading }: { trades?: Position[]; loading?: boolean }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
        Recent trades on this market
      </div>
      {loading ? (
        <div className="flex flex-col gap-2 p-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : !trades?.length ? (
        <div className="px-4 py-8 text-center text-sm text-muted">No trades on this market yet.</div>
      ) : (
        trades.map((t, i) => (
          <a
            key={`${t.digest}-${i}`}
            href={SUISCAN_TX(t.digest)}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between border-t border-line px-4 py-2.5 transition first:border-t-0 hover:bg-paper"
            title="View this transaction on Suiscan"
          >
            <div className="flex min-w-0 items-center gap-2">
              <DirBadge direction={t.direction} />
              <span className="text-[13px] font-semibold">${formatUsd(t.strikeUsd, 0)}</span>
              {t.trader && <span className="truncate font-mono text-[10.5px] text-faint">{formatAddress(t.trader)}</span>}
            </div>
            <span className="flex shrink-0 items-center gap-2 font-mono text-xs tabular-nums text-muted">
              {formatUsd(t.quantityUsd)} · {formatUsd(t.costUsd)}
              <span className="text-faint transition group-hover:text-green">↗</span>
            </span>
          </a>
        ))
      )}
    </Card>
  );
}
