import { useQuery } from '@tanstack/react-query';
import { STALE } from '@/lib/constants';
import { getStoredBalanceManager } from '@/lib/spot/bmStore';
import { apiGet } from './client';

/**
 * Resolves the connected wallet's DeepBook BalanceManager id. The authoritative source is the
 * captured-at-creation id in localStorage (DeepBook's on-chain `getBalanceManagerIds` does NOT return
 * shared managers, so it can't be trusted to find one the user already made). We return the stored id
 * immediately when present, and only fall back to the BFF resolver for a wallet with no local record.
 */
export function useBalanceManager(owner?: string) {
  return useQuery({
    queryKey: ['balanceManager', owner],
    enabled: !!owner,
    queryFn: async (): Promise<{ balanceManagerId: string | null; error?: boolean }> => {
      const stored = getStoredBalanceManager(owner);
      if (stored) return { balanceManagerId: stored };
      return apiGet<{ balanceManagerId: string | null; error?: boolean }>(`/api/spot/balance-manager?owner=${owner}`);
    },
    staleTime: STALE.manager,
  });
}
