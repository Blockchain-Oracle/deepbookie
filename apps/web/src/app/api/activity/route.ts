import { NextResponse } from 'next/server';
import { getActivity } from '@/lib/bff/activity';
import { logger } from '@/lib/logger.server';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('limit');
  const parsed = raw ? parseInt(raw, 10) : DEFAULT_LIMIT;
  const limit = Math.min(Math.max(Number.isFinite(parsed) ? parsed : DEFAULT_LIMIT, 1), MAX_LIMIT);
  try {
    return NextResponse.json(await getActivity(limit));
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'GET /api/activity');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
