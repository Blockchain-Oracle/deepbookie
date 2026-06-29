import { NextResponse } from 'next/server';
import { executeSponsored } from '@/lib/enoki.server';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Execute a sponsored transaction once the wallet has signed it (Slice B). Enoki co-signs with its
 * gas key and submits. Returns the on-chain digest.
 */
export async function POST(req: Request) {
  let body: { digest?: string; signature?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const { digest, signature } = body;
  if (!digest || !signature) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  try {
    const res = await executeSponsored(digest, signature);
    return NextResponse.json({ digest: res.digest });
  } catch (err) {
    logger.error(
      { digest, err: err instanceof Error ? err.message : String(err) },
      'sponsor execute failed',
    );
    return NextResponse.json(
      { error: 'sponsor_failed', message: 'The sponsored transaction couldn’t be submitted — try again.' },
      { status: 502 },
    );
  }
}
