import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '@/lib/constants';
import { apiGet } from './client';
import type { MarketDetail, MarketEnriched, Position } from '@/lib/bff/types';

export function useMarkets() {
  return useQuery({
    queryKey: ['markets'],
    queryFn: () => apiGet<MarketEnriched[]>('/api/markets'),
    refetchInterval: POLL.markets,
    staleTime: STALE.markets,
    placeholderData: keepPreviousData,
  });
}

/** Recent trades on one market — the live tape on the market detail page. */
export function useMarketTrades(oracleId?: string) {
  return useQuery({
    queryKey: ['marketTrades', oracleId],
    enabled: !!oracleId,
    queryFn: () => apiGet<Position[]>(`/api/markets/${oracleId}/trades`),
    refetchInterval: POLL.activity,
    staleTime: STALE.activity,
    placeholderData: keepPreviousData,
  });
}

export function useMarket(oracleId?: string) {
  return useQuery({
    queryKey: ['market', oracleId],
    enabled: !!oracleId,
    queryFn: () => apiGet<MarketDetail>(`/api/markets/${oracleId}`),
    refetchInterval: POLL.curve,
    staleTime: STALE.curve,
    placeholderData: keepPreviousData,
  });
}
