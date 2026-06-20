import { INDEXER_URL, REVALIDATE } from '@/lib/constants';
import { cachedRead } from './read';
import type { AccountView, Portfolio, Positions } from './types';

const ADDRESS_RE = /^0x[0-9a-fA-F]{64}$/;

/**
 * PredictManager is a SHARED object, so getOwnedObjects can't find it — resolve via the indexer's
 * owner-filtered endpoint. A wallet may have 0 (fresh → create_manager) or >1 (use the first).
 */
export async function resolveManagerByOwner(owner: string): Promise<string | null> {
  if (!ADDRESS_RE.test(owner)) return null;
  const res = await fetch(`${INDEXER_URL}/managers?owner=${owner}`);
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ manager_id?: string }>;
  return rows[0]?.manager_id ?? null;
}

export function getPortfolio(managerId: string) {
  return cachedRead<Portfolio>(
    'get_portfolio',
    { managerId },
    { revalidate: REVALIDATE.manager, tags: [`manager:${managerId}`] },
  );
}

export function getPositions(managerId: string) {
  return cachedRead<Positions>(
    'get_positions',
    { managerId },
    { revalidate: REVALIDATE.manager, tags: [`manager:${managerId}`] },
  );
}

export async function getAccountView(opts: { manager?: string; owner?: string }): Promise<AccountView> {
  const managerId = opts.manager ?? (opts.owner ? await resolveManagerByOwner(opts.owner) : null);
  if (!managerId) return { managerId: null, portfolio: null, positions: null };
  const [portfolio, positions] = await Promise.all([getPortfolio(managerId), getPositions(managerId)]);
  return { managerId, portfolio, positions };
}
