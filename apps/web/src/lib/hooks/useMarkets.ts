import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '@/lib/constants';
import { apiGet } from './client';
import type { Market, MarketDetail } from '@/lib/bff/types';

export function useMarkets() {
  return useQuery({
    queryKey: ['markets'],
    queryFn: () => apiGet<Market[]>('/api/markets'),
    refetchInterval: POLL.markets,
    staleTime: STALE.markets,
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
