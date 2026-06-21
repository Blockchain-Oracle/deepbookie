import { and, eq } from 'drizzle-orm';
import { getDb } from './client';
import { managers, type ManagerKind } from './schema';

/** The captured manager id for (wallet, kind), or null. No-ops to null when the DB is unconfigured. */
export async function getStoredManager(wallet: string, kind: ManagerKind): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select({ managerId: managers.managerId })
    .from(managers)
    .where(and(eq(managers.walletAddress, wallet), eq(managers.kind, kind)))
    .limit(1);
  return rows[0]?.managerId ?? null;
}

/** Persist the manager id captured at creation (idempotent — first write wins for a wallet+kind). */
export async function upsertManager(wallet: string, kind: ManagerKind, managerId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .insert(managers)
    .values({ walletAddress: wallet, kind, managerId })
    .onConflictDoNothing({ target: [managers.walletAddress, managers.kind] });
}
