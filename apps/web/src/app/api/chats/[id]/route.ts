import { NextResponse } from 'next/server';
import { getChat } from '@/lib/db/chats';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** One saved session. Ownership-checked against `?wallet=` — a mismatch is a 404 (no cross-wallet IDOR). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wallet = new URL(req.url).searchParams.get('wallet');
  if (!wallet) return NextResponse.json({ error: 'not found' }, { status: 404 });
  try {
    const chat = await getChat(id, wallet);
    if (!chat) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json(chat);
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err), id }, 'GET /api/chats/[id]');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
