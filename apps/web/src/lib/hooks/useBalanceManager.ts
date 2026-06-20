import { useQuery } from '@tanstack/react-query';
import { STALE } from '@/lib/constants';
import { getStoredBalanceManager, isStorageAvailable } from '@/lib/spot/bmStore';
import { apiGet } from './client';

interface BmResult {
  balanceManagerId: string | null;
  /** Resolver call FAILED (transient) — distinct from a genuine null (no account). */
  error?: boolean;
  /** localStorage is blocked, so we couldn't read a captured id and the resolver can't find shared
   *  BMs either — the UI must warn before offering "create" (a returning user would orphan funds). */
  storageBlocked?: boolean;
}

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
    queryFn: async (): Promise<BmResult> => {
      const stored = getStoredBalanceManager(owner);
      if (stored) return { balanceManagerId: stored };
      // No stored id AND storage is blocked → the resolver can't find shared BMs, so we genuinely
      // can't tell if one exists. Flag it so the panel warns rather than silently offering "create".
      if (!isStorageAvailable()) return { balanceManagerId: null, storageBlocked: true };
      return apiGet<BmResult>(`/api/spot/balance-manager?owner=${owner}`);
    },
    staleTime: STALE.manager,
  });
}
