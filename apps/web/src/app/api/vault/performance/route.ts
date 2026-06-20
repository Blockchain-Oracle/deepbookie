import { NextResponse } from 'next/server';
import { getVaultHistory } from '@/lib/bff/vault';
import { logger } from '@/lib/logger.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getVaultHistory());
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'GET /api/vault/performance');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
