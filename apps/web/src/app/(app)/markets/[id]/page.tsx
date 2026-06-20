'use client';

import { useParams, useRouter } from 'next/navigation';
import { Page } from '@/components/shell/Page';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { CoinLogo } from '@/components/widgets/CoinLogo';
import { OddsCurveCard } from '@/components/widgets/OddsCurveCard';
import { TradeTape } from '@/components/widgets/TradeTape';
import { useMarket, useMarketTrades } from '@/lib/hooks/useMarkets';
import { SUISCAN_OBJECT } from '@/lib/constants';
import { chatHref, betPrompt } from '@/lib/marketIntent';
import { formatAddress, formatCountdown, formatPct, formatSettleTime, formatUsd } from '@/lib/format';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className="mt-0.5 font-mono text-[15px] font-bold tabular-nums">{value}</div>
    </div>
  );
}

/** Market detail — live odds curve, spot/forward/expiry stats, and the recent-trades tape. */
export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError } = useMarket(id);
  const trades = useMarketTrades(id);

  if (isLoading && !data) {
    return (
      <Page>
        <Skeleton className="mb-5 h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </Page>
    );
  }
  if (isError || !data) {
    return (
      <Page>
        <BackLink onBack={() => router.push('/markets')} />
        <Card className="p-8 text-center text-sm text-muted">Couldn’t load this market right now.</Card>
      </Page>
    );
  }

  const { market, odds } = data;
  const settled = market.status !== 'active';

  return (
    <Page>
      <BackLink onBack={() => router.push('/markets')} />

      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CoinLogo asset={market.asset} size={38} />
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.02em]">{market.asset} binary</h2>
            <div className="text-[12.5px] text-muted">
              above / below · settles {formatSettleTime(market.expiry)} ({formatCountdown(market.expiry)})
            </div>
            <a
              href={SUISCAN_OBJECT(market.oracleId)}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-faint transition hover:text-green"
              title="View this market object on Suiscan"
            >
              {formatAddress(market.oracleId)} · Verify on Suiscan ↗
            </a>
          </div>
        </div>
        {settled ? (
          <span className="rounded-pill border border-line-strong px-3 py-1 font-mono text-[10.5px] uppercase text-muted">settled</span>
        ) : (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-green" />
            <span className="font-mono text-[11px] font-semibold text-green">LIVE</span>
          </span>
        )}
      </div>

      <Card className="mb-5 flex flex-wrap gap-x-10 gap-y-4 p-5">
        <Stat label="Spot" value={market.spot != null ? `$${formatUsd(market.spot, 0)}` : '—'} />
        <Stat label="Forward" value={market.forward != null ? `$${formatUsd(market.forward, 0)}` : '—'} />
        <Stat label="P(up) ATM" value={odds ? formatPct(odds.atmProbabilityUp) : '—'} />
        <Stat label="Expiry" value={formatCountdown(market.expiry)} />
        <Stat label="Min strike" value={`$${formatUsd(market.minStrike, 0)}`} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <OddsCurveCard
          status={settled ? 'empty' : odds ? 'live' : 'loading'}
          odds={odds ?? undefined}
          asset={market.asset}
          settled={settled}
          onBet={(direction, strikeUsd) =>
            router.push(
              chatHref(
                betPrompt({
                  asset: market.asset,
                  expiry: market.expiry,
                  oracleId: market.oracleId,
                  direction,
                  strikeUsd,
                }),
              ),
            )
          }
        />
        <TradeTape trades={trades.data} loading={trades.isLoading && !trades.data} />
      </div>
    </Page>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="mb-4 text-[13px] font-semibold text-muted transition hover:text-ink">
      ← Markets
    </button>
  );
}
