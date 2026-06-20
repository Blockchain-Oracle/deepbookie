import { createContext, resolveBalanceManagerIds } from '@deepbookie/core';
import { NETWORK } from '@/lib/constants';
import { withReliability } from './read';

/**
 * Resolve the connected wallet's DeepBook BalanceManager (owner → manager), mirroring the Predict
 * `resolveManagerByOwner`. The SDK reads live chain state (devInspect), so a manager created moments
 * ago resolves immediately. Returns the first id, or null when the wallet has no spot account yet.
 */
export async function resolveBalanceManagerByOwner(owner: string): Promise<string | null> {
  const ctx = createContext({ network: NETWORK, sender: owner });
  const ids = await withReliability(() => resolveBalanceManagerIds(ctx, owner));
  return ids[0] ?? null;
}
