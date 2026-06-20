import { NextResponse } from 'next/server';
import { getMarkets } from '@/lib/bff/markets';
import { logger } from '@/lib/logger.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getMarkets());
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'GET /api/markets');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
