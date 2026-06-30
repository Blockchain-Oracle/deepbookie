import { NextResponse } from 'next/server';
import { createSponsored, enokiErrorInfo } from '@/lib/enoki.server';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADDRESS_RE = /^0x[0-9a-fA-F]{64}$/;

/**
 * Sponsor a transaction's gas (Slice B). The client sends the `onlyTransactionKind` bytes + sender;
 * Enoki returns a full sponsored tx (gas paid by Enoki) for the wallet to sign. Operational errors
 * are logged server-side only; the client gets a generic message.
 */
const TARGET_RE = /^0x[0-9a-fA-F]{1,64}::[A-Za-z_][\w]*::[A-Za-z_][\w]*$/;

export async function POST(req: Request) {
  let body: { sender?: string; transactionKindBytes?: string; allowedMoveCallTargets?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const sender = body.sender?.trim();
  const transactionKindBytes = body.transactionKindBytes;
  // Targets are extracted by the client from the very tx being sponsored (already normalized) — Enoki
  // requires a non-empty allowlist that exact-matches the tx's move calls.
  const targets = Array.isArray(body.allowedMoveCallTargets)
    ? body.allowedMoveCallTargets.filter((t): t is string => typeof t === 'string' && TARGET_RE.test(t))
    : [];
  if (!sender || !ADDRESS_RE.test(sender) || !transactionKindBytes || targets.length === 0) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  try {
    const { bytes, digest } = await createSponsored(sender, transactionKindBytes, targets);
    return NextResponse.json({ bytes, digest });
  } catch (err) {
    const info = enokiErrorInfo(err);
    logger.error({ sender, ...info }, 'sponsor create failed');
    // Testnet: surface Enoki's actual reason to the client so failures are debuggable.
    return NextResponse.json(
      { error: 'sponsor_failed', message: info.message, code: info.code, detail: info.errors },
      { status: 502 },
    );
  }
}
