import { NextResponse } from 'next/server';
import { listChats } from '@/lib/db/chats';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A wallet's saved chat sessions (History list). `?wallet=` is required and scopes the result. */
export async function GET(req: Request) {
  const wallet = new URL(req.url).searchParams.get('wallet');
  if (!wallet) return NextResponse.json([], { status: 200 });
  try {
    return NextResponse.json(await listChats(wallet));
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'GET /api/chats');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
