import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['balanceManager', owner],
    enabled: !!owner,
    queryFn: async (): Promise<BmResult> => {
      const stored = getStoredBalanceManager(owner);
      if (stored) return { balanceManagerId: stored };
      // No stored id AND storage is blocked → the resolver can't find shared BMs, so we genuinely
      // can't tell if one exists. Flag it so the panel warns rather than silently offering "create".
      if (!isStorageAvailable()) return { balanceManagerId: null, storageBlocked: true };
      // Catch transport/HTTP failures HERE so a hard error surfaces as the soft `error` flag that every
      // consumer already handles (retry, never "create"). Otherwise apiGet throws → React Query
      // isError + undefined data → cards/panel fall through to the duplicate-BM "create" path. This
      // also avoids React Query's silent 3× retry wait before the user sees the retry state.
      try {
        const res = await apiGet<BmResult>(`/api/spot/balance-manager?owner=${owner}`);
        // If a prior capture-failure seeded {error:true} (just-created BM whose id we couldn't capture)
        // and the resolver STILL can't find the shared BM, keep the error so the panel shows Retry —
        // don't let a clean null clobber the seed and invite a duplicate create. A real id (or a throw)
        // correctly overrides it. (The bustCaches after create invalidates this query, so without this
        // the synchronous refetch would overwrite the seed.)
        if (res.balanceManagerId == null && !res.error) {
          const prev = qc.getQueryData<BmResult>(['balanceManager', owner]);
          if (prev?.error) return { balanceManagerId: null, error: true };
        }
        return res;
      } catch {
        return { balanceManagerId: null, error: true };
      }
    },
    staleTime: STALE.manager,
  });
}
