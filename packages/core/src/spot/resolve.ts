import type { ToolContext } from '../context.js';
import { spotClient } from './client.js';

/**
 * Resolve the DeepBook BalanceManager object ids a wallet owns via the SDK's `getBalanceManagerIds`.
 * IMPORTANT: this does NOT return a BalanceManager created via `createAndShareBalanceManager` — that is
 * a SHARED object, not owner-indexed — so it is a FALLBACK only. The authoritative source is the
 * captured-at-creation id persisted client-side in localStorage (see apps/web bmStore). Returns `[]`
 * when none are found (which, for a shared BM, is the expected result — not proof the user has none).
 */
export async function resolveBalanceManagerIds(ctx: ToolContext, owner: string): Promise<string[]> {
  return spotClient(ctx).getBalanceManagerIds(owner);
}
