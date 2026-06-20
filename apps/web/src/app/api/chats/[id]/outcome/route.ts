import { NextResponse } from 'next/server';
import { ensureChat, getChat, recordOutcome } from '@/lib/db/chats';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = new Set(['signed', 'cancelled', 'failed']);

/** Record a sign outcome the instant it happens (belt-and-suspenders, independent of the stream). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const b = (await req.json()) as {
      toolCallId?: string;
      walletAddress?: string;
      toolName?: string;
      status?: string;
      digest?: string | null;
    };
    if (!b.toolCallId || !b.walletAddress || !b.status || !STATUSES.has(b.status)) {
      return NextResponse.json({ error: 'bad request' }, { status: 400 });
    }
    // Claim the session for this wallet if new, then verify ownership — a chatId already owned by
    // another wallet yields no row here → 404 (write-side isolation). Also guarantees a discoverable
    // parent so a signed trade is never orphaned if the stream never resumes.
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
