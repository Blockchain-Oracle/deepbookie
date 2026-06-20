import { NextResponse } from 'next/server';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { ensureChat, getChat, recordOutcome } from '@/lib/db/chats';
import { allowRequest, clientIp } from '@/lib/rate-limit';
import { CHAT_RATE_PER_IP, CHAT_RATE_WINDOW_MS } from '@/lib/constants';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = new Set(['signed', 'cancelled', 'failed']);

/**
 * Record a sign outcome the instant it happens (belt-and-suspenders, independent of the stream).
 * `walletAddress` here is an unverified identity claim, NOT authorization — the session row is keyed
 * by a secret random chatId. The per-IP rate-limit caps abuse; SIWS session auth is the fast-follow.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!allowRequest(`outcome:${clientIp(req)}`, CHAT_RATE_PER_IP, CHAT_RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  const { id } = await params;
  try {
    const b = (await req.json()) as {
      toolCallId?: string;
      walletAddress?: string;
      toolName?: string;
      status?: string;
      digest?: string | null;
    };
    if (!b.toolCallId || !b.walletAddress || !isValidSuiAddress(b.walletAddress) || !b.status || !STATUSES.has(b.status)) {
      return NextResponse.json({ error: 'bad request' }, { status: 400 });
    }
    // Ensure a discoverable parent row exists so a signed trade isn't orphaned if the stream never
    // resumes, then verify ownership. NOTE: this is NOT a strong auth boundary — the FIRST caller of a
    // (122-bit random, unguessable) chatId owns it; truly binding the id to a verified wallet needs
    // SIWS session auth (the documented fast-follow). A 2nd wallet supplying the same id → no row → 404.
    await ensureChat(id, b.walletAddress);
    if (!(await getChat(id, b.walletAddress))) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    await recordOutcome({
      toolCallId: b.toolCallId,
      chatId: id,
      wallet: b.walletAddress,
      toolName: b.toolName ?? '',
      status: b.status as 'signed' | 'cancelled' | 'failed',
      digest: b.digest ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err), id }, 'POST /api/chats/[id]/outcome');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
