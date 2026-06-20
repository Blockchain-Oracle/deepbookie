/**
 * Persistent BalanceManager resolution. DeepBook's `getBalanceManagerIds(owner)` does NOT return a
 * BalanceManager created via `createAndShareBalanceManager` (it's a shared object, not owner-indexed),
 * so after a user creates one the on-chain resolver still says "none" — which made the app ask them to
 * create it again on every reload. We instead CAPTURE the id at creation and persist it per-wallet in
 * localStorage; that is the authoritative client-side source, with the on-chain resolver as a fallback.
 */
import { clientLogger } from '@/lib/logger.client';

const KEY = (owner: string) => `deepbookie.bm.${owner.toLowerCase()}`;

// Storage being blocked (private mode / hardened browser) is a real, distinct condition from "no id
// stored": the resolver runs on reload and can't find shared BMs, so the user gets re-prompted to set
// up an account. We can't fix that without a persister, but we log it once so it isn't silent.
let warnedStorageBlocked = false;
function noteStorageBlocked(): void {
  if (warnedStorageBlocked) return;
  warnedStorageBlocked = true;
  clientLogger.warn('localStorage unavailable — BalanceManager id will not persist across reloads');
}

export function getStoredBalanceManager(owner: string | undefined | null): string | null {
  if (!owner || typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(KEY(owner));
  } catch {
    noteStorageBlocked();
    return null;
  }
}

export function setStoredBalanceManager(owner: string, balanceManagerId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY(owner), balanceManagerId);
  } catch {
    // storage disabled — the in-memory query cache still carries it for this session
    noteStorageBlocked();
  }
}

/**
 * Probe whether localStorage is usable (private/hardened browsers block it). Lets callers tell a
 * genuine "no stored id" apart from "can't read storage" — the latter must NOT collapse into "no
 * account", which would invite a returning user to create a duplicate (orphaning) BalanceManager.
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const probe = 'deepbookie.probe';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    noteStorageBlocked();
    return false;
  }
}
