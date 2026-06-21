import { NextResponse } from 'next/server';
import { getMarketTrades } from '@/lib/bff/markets';
import { logger } from '@/lib/logger.server';

export const dynamic = 'force-dynamic';

/** Recent trades on one market (anonymous-ish: direction/strike/size/cost + trader address). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json(await getMarketTrades(id));
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err), id },
      'GET /api/markets/[id]/trades',
    );
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
