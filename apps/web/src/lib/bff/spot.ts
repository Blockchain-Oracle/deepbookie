import { createContext, resolveBalanceManagerIds } from '@deepbookie/core';
import { NETWORK } from '@/lib/constants';
import { withReliability } from './read';
import { getStoredManager } from '@/lib/db/managers';

/**
 * Resolve the connected wallet's DeepBook BalanceManager (owner → manager). The BalanceManager is a
 * SHARED object that `getBalanceManagerIds` can't see, so we check the DB-captured id FIRST (written at
 * creation — instant + durable across devices), then fall back to the bounded on-chain tx-scan. Returns
 * null only when neither source has one.
 */
export async function resolveBalanceManagerByOwner(owner: string): Promise<string | null> {
  const captured = await getStoredManager(owner, 'balance');
  if (captured) return captured;
  const ctx = createContext({ network: NETWORK, sender: owner });
  const ids = await withReliability(() => resolveBalanceManagerIds(ctx, owner));
  return ids[0] ?? null;
}
