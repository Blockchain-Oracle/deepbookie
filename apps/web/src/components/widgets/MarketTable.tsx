'use client';

import { useState, type ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { CoinLogo } from '@/components/widgets/CoinLogo';
import { SUISCAN_OBJECT } from '@/lib/constants';
import { formatCountdown, formatSettleTime, shortenDigest } from '@/lib/format';
import type { Market } from '@/lib/bff/types';

/**
 * Markets directory in chat. Each row shows the asset's OWN logo and opens an info modal (explorer link
 * + stats + "View odds & bet") so the user can EXPLORE a market before picking — instead of the agent
 * silently choosing one. `onPick` sends the show-odds prompt for the chosen market (omitted in replay).
 */
export function MarketTable({ markets, onPick }: { markets: Market[]; onPick?: (m: Market) => void }) {
  const [detail, setDetail] = useState<Market | null>(null);

  if (!markets.length) {
    return <Card className="p-6 text-center text-sm text-muted">No open markets right now.</Card>;
  }
  return (
    <>
      <Card className="overflow-hidden p-0">
        <div className="flex items-center bg-[#FAF8F3] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
          <span className="flex-[2]">Market</span>
          <span className="flex-1 text-right">Expiry</span>
          <span className="w-16 text-right">Status</span>
        </div>
        {markets.slice(0, 8).map((m) => (
          <button
            key={m.oracleId}
            type="button"
            onClick={() => (onPick ? setDetail(m) : undefined)}
            className={`flex w-full items-center border-t border-line px-4 py-3 text-left transition ${onPick ? 'hover:bg-paper' : 'cursor-default'}`}
          >
            <span className="flex flex-[2] items-center gap-2.5">
              <CoinLogo asset={m.asset} size={24} />
              <span className="text-sm font-semibold">{m.asset} binary</span>
            </span>
            <span className="flex-1 text-right font-mono text-xs text-muted">{formatCountdown(m.expiry)}</span>
            <span className="w-16 text-right">
              {m.status === 'active' ? (
                <span className="inline-block size-1.5 rounded-full bg-green" />
              ) : (
                <span className="font-mono text-[9px] uppercase text-faint">settled</span>
              )}
            </span>
          </button>
        ))}
      </Card>

      {detail && onPick && (
        <MarketDetailModal
          market={detail}
          onClose={() => setDetail(null)}
          onPick={() => {
            const m = detail;
            setDetail(null);
            onPick(m);
          }}
        />
      )}
    </>
  );
}

function MarketDetailModal({ market, onClose, onPick }: { market: Market; onClose: () => void; onPick: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <Card className="w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5">
          <CoinLogo asset={market.asset} size={34} />
          <div>
            <div className="text-[15px] font-bold">{market.asset} binary</div>
            <div className="font-mono text-[11px] text-muted">
              {market.status === 'active' ? `live · ${formatCountdown(market.expiry)} left` : 'settled'}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-px">
          <Row label="Settles" value={formatSettleTime(market.expiry)} />
          <Row label="Status" value={market.status === 'active' ? 'Active' : 'Settled'} />
          <Row
            label="Oracle"
            value={
              <a
                href={SUISCAN_OBJECT(market.oracleId)}
                target="_blank"
                rel="noreferrer"
                className="border-b-[1.3px] border-green font-mono text-[11.5px] font-semibold text-green"
              >
                {shortenDigest(market.oracleId)} ↗
              </a>
            }
          />
        </div>

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={onPick}
            className="flex-1 rounded-card-in bg-ink py-2.5 text-[13.5px] font-semibold text-paper transition hover:opacity-90"
          >
            View odds &amp; bet
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-card-in border border-line-strong px-5 py-2.5 text-[13.5px] font-semibold text-muted transition hover:bg-paper"
          >
            Close
          </button>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="text-[#7d7870]">{label}</span>
      <span className="font-mono tabular-nums text-ink">{value}</span>
    </div>
  );
}
