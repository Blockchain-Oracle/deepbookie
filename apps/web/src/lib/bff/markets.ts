import { ACTIVITY_SCAN_LIMIT, MARKETS_ENRICH_CONCURRENCY, MARKET_TRADES_LIMIT, REVALIDATE } from '@/lib/constants';
import { cachedRead } from './read';
import { getActivity } from './activity';
import type { Market, MarketEnriched, MarketState, Odds, Position } from './types';

export function getMarkets() {
  return cachedRead<Market[]>('list_markets', {}, { revalidate: REVALIDATE.markets, tags: ['markets'] });
}

/** Run an async map with bounded concurrency (keeps the markets fan-out off the indexer's knees). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor;
      cursor += 1;
      out[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Recent trade counts per market, from one cached pass over the global activity feed. */
async function getMarketVolumes(): Promise<Map<string, number>> {
  const trades = await getActivity(ACTIVITY_SCAN_LIMIT);
  const counts = new Map<string, number>();
  for (const t of trades) counts.set(t.oracleId, (counts.get(t.oracleId) ?? 0) + 1);
  return counts;
}

/**
 * The Markets board: active markets enriched with live spot + at-the-money P(up) (per-market, cached
 * + bounded fan-out) and recent volume. Enrichment failures degrade to null, never to a hung page.
 */
export async function getEnrichedMarkets(): Promise<MarketEnriched[]> {
  const [markets, volumes] = await Promise.all([getMarkets(), getMarketVolumes()]);
  return mapLimit(markets, MARKETS_ENRICH_CONCURRENCY, async (m) => {
    const base: MarketEnriched = { ...m, spot: null, pUp: null, volume: volumes.get(m.oracleId) ?? 0 };
    try {
      const odds = await getOdds(m.oracleId);
      return { ...base, spot: odds.spot, pUp: odds.atmProbabilityUp };
    } catch {
      return base;
    }
  });
}

/** Recent trades on one market (with trader address) — reuses the cached activity feed. */
export async function getMarketTrades(oracleId: string): Promise<Position[]> {
  const trades = await getActivity(ACTIVITY_SCAN_LIMIT);
  return trades.filter((t) => t.oracleId === oracleId).slice(0, MARKET_TRADES_LIMIT);
}

export function getMarketState(oracleId: string) {
  return cachedRead<MarketState>(
    'get_market',
    { oracleId },
    { revalidate: REVALIDATE.curve, tags: [`market:${oracleId}`] },
  );
}

export function getOdds(oracleId: string) {
  return cachedRead<Odds>(
    'get_odds',
    { oracleId },
    { revalidate: REVALIDATE.curve, tags: [`market:${oracleId}`] },
  );
}
