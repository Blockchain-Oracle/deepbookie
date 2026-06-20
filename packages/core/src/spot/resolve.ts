import type { ToolContext } from '../context.js';
import { spotClient } from './client.js';
import { BALANCE_MANAGER_TYPE } from './constants.js';

/** Best-effort scan depth (pages of 50 txs) for the shared-BalanceManager fallback. */
const TX_SCAN_PAGES = 3;
const TX_SCAN_PAGE_SIZE = 50;

type ObjChange = { type: string; objectType?: string; objectId?: string };

/**
 * Resolve the DeepBook BalanceManager object ids a wallet owns.
 *
 * The SDK's `getBalanceManagerIds` reads the owner-indexed registry — but this app creates its BM via
 * `createAndShareBalanceManager`, a SHARED object that is NOT registry-registered, so that lookup
 * returns `[]` for every BM we create. To still recover one on a fresh device / cleared storage (where
 * the captured-at-creation id in localStorage is gone), we fall back to scanning the owner's recent
 * transactions for a created `BalanceManager` object (the creator is the tx sender). The localStorage
 * capture remains the fast path; this is the cross-device safety net that prevents a returning user
 * from being told they have no account (which would invite a duplicate BM + orphan funds).
 */
export async function resolveBalanceManagerIds(ctx: ToolContext, owner: string): Promise<string[]> {
  const registered = await spotClient(ctx)
    .getBalanceManagerIds(owner)
    .catch(() => [] as string[]);
  if (registered.length) return registered;
  return scanCreatedBalanceManagers(ctx, owner);
}

/** Scan the owner's recent transactions (newest first) for a created shared BalanceManager object. */
async function scanCreatedBalanceManagers(ctx: ToolContext, owner: string): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | null | undefined;
  for (let page = 0; page < TX_SCAN_PAGES; page++) {
    const res = await ctx.client
      .queryTransactionBlocks({
        filter: { FromAddress: owner },
        options: { showObjectChanges: true },
        order: 'descending',
        cursor: cursor ?? null,
        limit: TX_SCAN_PAGE_SIZE,
      })
      .catch(() => null);
    if (!res) break;
    for (const tx of res.data ?? []) {
      for (const c of (tx.objectChanges ?? []) as ObjChange[]) {
        if (c.type === 'created' && c.objectId && c.objectType?.includes(BALANCE_MANAGER_TYPE)) {
          ids.push(c.objectId);
        }
      }
    }
    if (ids.length || !res.hasNextPage) break;
    cursor = res.nextCursor;
  }
  return ids;
}
