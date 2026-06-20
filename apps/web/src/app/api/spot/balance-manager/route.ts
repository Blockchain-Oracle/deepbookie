import { NextResponse } from 'next/server';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { resolveBalanceManagerByOwner } from '@/lib/bff/spot';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // wallet-scoped — never shared-cache

/** Resolve `owner` → DeepBook BalanceManager id (or null if none yet). Powers the spot onboarding gate. */
export async function GET(req: Request) {
  const owner = new URL(req.url).searchParams.get('owner');
  // Validate shape (matches /api/spot/read) — a malformed owner is a clean "none", not a wasted RPC.
  if (!owner || !isValidSuiAddress(owner)) return NextResponse.json({ balanceManagerId: null });
  try {
    const balanceManagerId = await resolveBalanceManagerByOwner(owner);
    return NextResponse.json({ balanceManagerId });
  } catch (err) {
    // Resolution failure ≠ "no manager"; surface null but flag it so the client doesn't hard-assert none.
    logger.error(
      { err: err instanceof Error ? err.message : String(err), owner },
      'GET /api/spot/balance-manager',
    );
    return NextResponse.json({ balanceManagerId: null, error: true });
  }
}
