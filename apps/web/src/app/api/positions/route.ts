import { NextResponse } from 'next/server';
import { getAccountView } from '@/lib/bff/positions';
import { logger } from '@/lib/logger.server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const manager = url.searchParams.get('manager') ?? undefined;
  const owner = url.searchParams.get('owner') ?? undefined;
  if (!manager && !owner) {
    return NextResponse.json({ error: 'manager_or_owner_required' }, { status: 400 });
  }
  try {
    return NextResponse.json(await getAccountView({ manager, owner }));
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'GET /api/positions');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
