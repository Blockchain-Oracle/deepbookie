import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '@/lib/constants';
import { apiGet } from './client';
import type { AccountView } from '@/lib/bff/types';

/** Resolves the connected wallet's manager (owner→manager) + portfolio + positions via the BFF. */
export function usePositions(owner?: string) {
  return useQuery({
    queryKey: ['positions', owner],
    enabled: !!owner,
    queryFn: () => apiGet<AccountView>(`/api/positions?owner=${owner}`),
    refetchInterval: POLL.manager,
    staleTime: STALE.manager,
    placeholderData: keepPreviousData,
  });
}
