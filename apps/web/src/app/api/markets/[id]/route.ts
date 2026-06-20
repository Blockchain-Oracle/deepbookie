import { NextResponse } from 'next/server';
import { getMarketState, getOdds } from '@/lib/bff/markets';
import { logger } from '@/lib/logger.server';
import type { MarketDetail } from '@/lib/bff/types';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // odds is null for settled markets (no live price/SVI) — the market state still loads.
    const [market, odds] = await Promise.all([getMarketState(id), getOdds(id).catch(() => null)]);
    return NextResponse.json({ market, odds } satisfies MarketDetail);
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err), id }, 'GET /api/markets/[id]');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
