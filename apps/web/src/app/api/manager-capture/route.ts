import { NextResponse } from 'next/server';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { upsertManager } from '@/lib/db/managers';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Capture a freshly-created manager id (PredictManager or BalanceManager) keyed by owner, so server
 * resolution finds it instantly (the indexer lags + the BalanceManager resolver can't see shared
 * objects). `owner` is the client's wallet — NOT an auth boundary (the id is public on-chain); this
 * only records "this wallet created this shared manager" to stop the duplicate-create nag.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { owner?: string; kind?: string; managerId?: string };
    const { owner, kind, managerId } = body;
    if (!owner || !isValidSuiAddress(owner)) return NextResponse.json({ error: 'invalid owner' }, { status: 400 });
    if (!managerId || !isValidSuiAddress(managerId)) return NextResponse.json({ error: 'invalid managerId' }, { status: 400 });
    if (kind !== 'predict' && kind !== 'balance') return NextResponse.json({ error: 'invalid kind' }, { status: 400 });
    await upsertManager(owner, kind, managerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'POST /api/manager-capture');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
