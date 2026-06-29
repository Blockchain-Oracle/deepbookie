import { NextResponse } from 'next/server';
import { createSponsored } from '@/lib/enoki.server';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADDRESS_RE = /^0x[0-9a-fA-F]{64}$/;

/**
 * Sponsor a transaction's gas (Slice B). The client sends the `onlyTransactionKind` bytes + sender;
 * Enoki returns a full sponsored tx (gas paid by Enoki) for the wallet to sign. Operational errors
 * are logged server-side only; the client gets a generic message.
 */
export async function POST(req: Request) {
  let body: { sender?: string; transactionKindBytes?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const sender = body.sender?.trim();
  const transactionKindBytes = body.transactionKindBytes;
  if (!sender || !ADDRESS_RE.test(sender) || !transactionKindBytes) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  try {
    const { bytes, digest } = await createSponsored(sender, transactionKindBytes);
    return NextResponse.json({ bytes, digest });
  } catch (err) {
    logger.error(
      { sender, err: err instanceof Error ? err.message : String(err) },
      'sponsor create failed',
    );
    return NextResponse.json(
      { error: 'sponsor_failed', message: 'Couldn’t sponsor this transaction — try again.' },
      { status: 502 },
    );
  }
}
