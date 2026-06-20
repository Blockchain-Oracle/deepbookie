import { REVALIDATE } from '@/lib/constants';
import { cachedRead } from './read';
import type { Market, MarketState, Odds } from './types';

export function getMarkets() {
  return cachedRead<Market[]>('list_markets', {}, { revalidate: REVALIDATE.markets, tags: ['markets'] });
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
