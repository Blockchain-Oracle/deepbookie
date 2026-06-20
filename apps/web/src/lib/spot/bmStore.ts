/**
 * Persistent BalanceManager resolution. DeepBook's `getBalanceManagerIds(owner)` does NOT return a
 * BalanceManager created via `createAndShareBalanceManager` (it's a shared object, not owner-indexed),
 * so after a user creates one the on-chain resolver still says "none" — which made the app ask them to
 * create it again on every reload. We instead CAPTURE the id at creation and persist it per-wallet in
 * localStorage; that is the authoritative client-side source, with the on-chain resolver as a fallback.
 */
const KEY = (owner: string) => `deepbookie.bm.${owner.toLowerCase()}`;

export function getStoredBalanceManager(owner: string | undefined | null): string | null {
  if (!owner || typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(KEY(owner));
  } catch {
    return null;
  }
}

export function setStoredBalanceManager(owner: string, balanceManagerId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY(owner), balanceManagerId);
  } catch {
    /* storage disabled — the in-memory query cache still carries it for this session */
  }
}
