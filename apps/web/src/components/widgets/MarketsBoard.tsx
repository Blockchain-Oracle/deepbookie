'use client';

import { Card } from '@/components/ui/Card';
import { CoinLogo } from './CoinLogo';
import { formatCountdown, formatPct, formatSettleTime, formatUsd } from '@/lib/format';
import type { MarketEnriched } from '@/lib/bff/types';

const TH = 'text-[10px] font-semibold uppercase tracking-[0.1em] text-faint';
const spot = (m: MarketEnriched) => (m.spot != null ? `$${formatUsd(m.spot, 0)}` : '—');
const pup = (m: MarketEnriched) => (m.pUp != null ? formatPct(m.pUp) : '—');

type Phase = 'live' | 'settling' | 'settled';
function phaseOf(m: MarketEnriched, now: number): Phase {
  if (m.status !== 'active') return 'settled';
  return m.expiry <= now ? 'settling' : 'live';
}

function StatusBadge({ phase }: { phase: Phase }) {
  if (phase === 'live')
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 animate-pulse rounded-full bg-green" />
        <span className="font-mono text-[10.5px] font-semibold text-green">LIVE</span>
      </span>
    );
  if (phase === 'settling')
    return <span className="font-mono text-[10px] font-semibold uppercase text-[#9c7a2a]">settling</span>;
  return (
    <span className="rounded-pill border border-line-strong px-2 py-0.5 font-mono text-[9.5px] uppercase text-faint">
      settled
    </span>
  );
}

export function MarketsBoard({
  markets,
  onOpen,
  onTrade,
}: {
  markets: MarketEnriched[];
  onOpen?: (m: MarketEnriched) => void;
  onTrade?: (m: MarketEnriched) => void;
}) {
  if (!markets.length) {
    return <Card className="p-8 text-center text-sm text-muted">No markets in this view.</Card>;
  }
  const now = Date.now();

  return (
    <>
      {/* Desktop table (tablet falls back to cards so dense columns don't cramp) */}
      <Card className="hidden overflow-hidden p-0 lg:block">
        <div className="flex items-center bg-[#FAF8F3] px-5 py-3">
          <span className={`${TH} flex-[2.4]`}>Market</span>
          <span className={`${TH} flex-1 text-right`}>Spot</span>
          <span className={`${TH} flex-1 text-right`}>P(up)</span>
          <span className={`${TH} w-16 text-right`}>Volume</span>
          <span className={`${TH} flex-1 text-right`}>Expiry</span>
          <span className={`${TH} w-24 text-right`}>Status</span>
          <span className="w-20" />
        </div>
        {markets.map((m) => {
          const phase = phaseOf(m, now);
          return (
            <div
              key={m.oracleId}
              role="button"
              tabIndex={0}
              onClick={() => onOpen?.(m)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen?.(m)}
              className="flex cursor-pointer items-center border-t border-line px-5 py-3.5 transition hover:bg-paper"
            >
              <div className="flex flex-[2.4] items-center gap-3">
                <CoinLogo asset={m.asset} size={30} />
                <div className="min-w-0">
                  <div className="truncate text-[14.5px] font-bold">{m.asset} binary</div>
                  <div className="text-[11.5px] text-faint">settles {formatSettleTime(m.expiry)}</div>
                </div>
              </div>
              <span className="flex-1 text-right font-mono text-[14px] font-semibold tabular-nums">{spot(m)}</span>
              <span className="flex-1 text-right font-mono text-[14px] font-bold tabular-nums text-green">{pup(m)}</span>
              <span className="w-16 text-right font-mono text-[13px] tabular-nums text-muted">{m.volume || '—'}</span>
              <span className="flex-1 text-right font-mono text-[12px] text-muted">{formatCountdown(m.expiry)}</span>
              <span className="w-24 text-right">
                <StatusBadge phase={phase} />
              </span>
              <span className="w-20 text-right">
                {phase === 'live' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTrade?.(m);
                    }}
                    className="rounded-[7px] border border-line-strong px-3 py-1.5 text-[12.5px] font-semibold text-ink transition hover:bg-canvas"
                  >
                    Trade
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </Card>

      {/* Tablet + mobile cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {markets.map((m) => {
          const phase = phaseOf(m, now);
          return (
            <Card key={m.oracleId} className="p-4" role="button" tabIndex={0} onClick={() => onOpen?.(m)}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CoinLogo asset={m.asset} size={26} />
                  <span className="text-[15px] font-bold">{m.asset} binary</span>
                </div>
                <StatusBadge phase={phase} />
              </div>
              <div className="flex justify-between">
                <Mini label="Spot" value={spot(m)} />
                <Mini label="P(up)" value={pup(m)} accent />
                <Mini label="Expiry" value={formatCountdown(m.expiry)} right />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Mini({ label, value, accent, right }: { label: string; value: string; accent?: boolean; right?: boolean }) {
  return (
    <div className={right ? 'text-right' : ''}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className={`mt-0.5 font-mono text-[14px] font-semibold tabular-nums ${accent ? 'text-green' : 'text-ink'}`}>
        {value}
      </div>
    </div>
  );
}
