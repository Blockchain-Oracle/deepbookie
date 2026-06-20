import { useQuery } from '@tanstack/react-query';
import { STALE } from '@/lib/constants';
import { apiGet } from './client';

/**
 * Resolves the connected wallet's DeepBook BalanceManager id (owner → manager) via the BFF — the
 * spot counterpart to {@link usePositions}'s Predict manager. No aggressive poll: resolution only
 * changes when the user creates/uses a manager, and `useSubmitTx` invalidates `['balanceManager']`
 * after every spot write (so a just-created manager appears immediately).
 */
export function useBalanceManager(owner?: string) {
  return useQuery({
    queryKey: ['balanceManager', owner],
    enabled: !!owner,
    queryFn: () =>
      apiGet<{ balanceManagerId: string | null; error?: boolean }>(
        `/api/spot/balance-manager?owner=${owner}`,
      ),
    staleTime: STALE.manager,
  });
}
