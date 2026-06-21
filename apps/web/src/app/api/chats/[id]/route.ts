import { NextResponse } from 'next/server';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { getChat, listOutcomes } from '@/lib/db/chats';
import { allowRequest, clientIp } from '@/lib/rate-limit';
import { CHAT_RATE_PER_IP, CHAT_RATE_WINDOW_MS } from '@/lib/constants';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** One saved session. Ownership-checked against `?wallet=` — a mismatch is a 404 (no cross-wallet IDOR). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!allowRequest(`chatread:${clientIp(req)}`, CHAT_RATE_PER_IP, CHAT_RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  const { id } = await params;
  const wallet = new URL(req.url).searchParams.get('wallet');
  if (!wallet || !isValidSuiAddress(wallet)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  try {
    const chat = await getChat(id, wallet);
    if (!chat) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const outcomes = await listOutcomes(id, wallet);
    return NextResponse.json({ ...chat, outcomes });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err), id }, 'GET /api/chats/[id]');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
