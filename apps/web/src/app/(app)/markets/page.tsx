'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Page, PageHeader } from '@/components/shell/Page';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { MarketsBoard } from '@/components/widgets/MarketsBoard';
import { useMarkets } from '@/lib/hooks/useMarkets';
import { chatHref, tradePrompt } from '@/lib/marketIntent';
import type { MarketEnriched } from '@/lib/bff/types';

type Filter = 'live' | 'settling' | 'settled';
type Sort = 'soonest' | 'volume';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'live', label: 'Live' },
  { key: 'settling', label: 'Settling' },
  { key: 'settled', label: 'Settled' },
];
const SORTS: { key: Sort; label: string }[] = [
  { key: 'soonest', label: 'Soonest' },
  { key: 'volume', label: 'Volume' },
];

function phaseOf(m: MarketEnriched, now: number): Filter {
  if (m.status !== 'active') return 'settled';
  return m.expiry <= now ? 'settling' : 'live';
}

/** Markets directory — enriched, filterable + sortable; a row opens the market detail, "Trade" → chat. */
export default function MarketsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('live');
  const [sort, setSort] = useState<Sort>('soonest');
  const { data, isLoading, isError } = useMarkets();
  const markets = data ?? [];
  const now = Date.now();
  const shown = markets
    .filter((m) => phaseOf(m, now) === filter)
    .sort((a, b) => (sort === 'volume' ? b.volume - a.volume || a.expiry - b.expiry : a.expiry - b.expiry));

  return (
    <Page>
      <PageHeader
        title="Markets"
        subtitle="Live BTC markets on DeepBook Predict testnet — one market per expiry, priced on-chain"
        action={
          <div className="flex flex-wrap justify-end gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-card-in px-3.5 py-2 text-[13px] font-semibold transition ${
                  filter === f.key
                    ? 'bg-ink text-paper'
                    : 'border border-line-strong text-[#7d7870] hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-3 flex items-center justify-end gap-2 text-[12px]">
        <span className="text-faint">Sort</span>
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSort(s.key)}
            className={`rounded-pill px-3 py-1 font-semibold transition ${
              sort === s.key ? 'bg-ink text-paper' : 'border border-line-strong text-[#7d7870] hover:text-ink'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && !data ? (
        <Skeleton className="h-72 w-full" />
      ) : isError ? (
        <Card className="p-6 text-center text-sm text-muted">
          Couldn’t load markets right now. They’ll reappear once the indexer responds.
        </Card>
      ) : filter === 'settled' && shown.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">
          Settled markets live in your <span className="font-semibold text-ink">Positions</span> and{' '}
          <span className="font-semibold text-ink">History</span>.
        </Card>
      ) : (
        <MarketsBoard
          markets={shown}
          onOpen={(m) => router.push(`/markets/${m.oracleId}`)}
          onTrade={(m) => router.push(chatHref(tradePrompt(m)))}
        />
      )}
    </Page>
  );
}
