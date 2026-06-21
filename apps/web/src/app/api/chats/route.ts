import { NextResponse } from 'next/server';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { listChats } from '@/lib/db/chats';
import { allowRequest, clientIp } from '@/lib/rate-limit';
import { CHAT_RATE_PER_IP, CHAT_RATE_WINDOW_MS } from '@/lib/constants';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A wallet's saved chat sessions (History list). `?wallet=` is required and scopes the result. NOTE:
 * the wallet is an unverified PUBLIC identifier (not auth) — per-IP rate-limited to cap enumeration of
 * session titles; binding reads to a verified session is the documented SIWS fast-follow.
 */
export async function GET(req: Request) {
  if (!allowRequest(`chatsread:${clientIp(req)}`, CHAT_RATE_PER_IP, CHAT_RATE_WINDOW_MS)) {
    return NextResponse.json([], { status: 429 });
  }
  const wallet = new URL(req.url).searchParams.get('wallet');
  // Validate shape before using it as a DB key (defense-in-depth against junk-identity row spam).
  if (!wallet || !isValidSuiAddress(wallet)) return NextResponse.json([], { status: 200 });
  try {
    return NextResponse.json(await listChats(wallet));
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'GET /api/chats');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
