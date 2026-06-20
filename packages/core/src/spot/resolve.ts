import type { ToolContext } from '../context.js';
import { spotClient } from './client.js';

/**
 * Resolve the DeepBook BalanceManager object ids a wallet owns. Uses the SDK's live
 * `simulateTransaction` (devInspect) — NOT a lagging indexer — so a manager created moments ago is
 * returned on the next call. The web threads `balanceManagerId` from the first id (mirrors how the
 * Predict `managerId` is resolved from `/managers?owner=`). Returns `[]` when the wallet has none.
 */
export async function resolveBalanceManagerIds(ctx: ToolContext, owner: string): Promise<string[]> {
  return spotClient(ctx).getBalanceManagerIds(owner);
}
