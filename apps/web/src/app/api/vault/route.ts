import { NextResponse } from 'next/server';
import { getVault } from '@/lib/bff/vault';
import { logger } from '@/lib/logger.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getVault());
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'GET /api/vault');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
