import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '@/lib/constants';
import { apiGet } from './client';
import type { Position } from '@/lib/bff/types';

export function useActivity(limit = 20) {
  return useQuery({
    queryKey: ['activity', limit],
    queryFn: () => apiGet<Position[]>(`/api/activity?limit=${limit}`),
    refetchInterval: POLL.activity,
    staleTime: STALE.activity,
    placeholderData: keepPreviousData,
  });
}
