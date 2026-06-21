import { NextResponse } from 'next/server';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { getChat, listOutcomes, upsertChat } from '@/lib/db/chats';
import { allowRequest, clientIp } from '@/lib/rate-limit';
import { CHAT_MAX_MESSAGES, CHAT_RATE_PER_IP, CHAT_RATE_WINDOW_MS } from '@/lib/constants';
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

/**
 * Client-side transcript save (belt-and-suspenders): the server `onFinish` already persists each turn,
 * but a tab closed mid-stream would skip it. The client PATCHes the transcript after each turn so a
 * signed session is never lost and gets a real title (not the "New chat" default). `walletAddress` is an
 * unverified identity claim keyed to the secret chatId — NOT auth (SIWS is the fast-follow).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!allowRequest(`chatsave:${clientIp(req)}`, CHAT_RATE_PER_IP, CHAT_RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  const { id } = await params;
  try {
    const b = (await req.json()) as { walletAddress?: string; title?: string; messages?: unknown };
    if (!b.walletAddress || !isValidSuiAddress(b.walletAddress)) {
      return NextResponse.json({ error: 'bad request' }, { status: 400 });
    }
    if (!Array.isArray(b.messages) || b.messages.length > CHAT_MAX_MESSAGES) {
      return NextResponse.json({ error: 'bad request' }, { status: 400 });
    }
    await upsertChat({ id, wallet: b.walletAddress, title: (b.title || 'New chat').slice(0, 120), messages: b.messages });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err), id }, 'PATCH /api/chats/[id]');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
