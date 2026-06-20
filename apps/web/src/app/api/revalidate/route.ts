import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Allowlist so a hostile caller can't flush arbitrary tags (cache-stampede DoS).
const ALLOWED = /^(markets|activity|vault|market:0x[0-9a-fA-F]{1,66}|manager:0x[0-9a-fA-F]{1,66})$/;
const MAX_TAGS = 10;

/** Bust server-cache tags after a signed write so the next read reflects chain. */
export async function POST(req: Request) {
  let tags: string[] = [];
  try {
    tags = ((await req.json()) as { tags?: string[] }).tags ?? [];
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const valid = tags.filter((t) => typeof t === 'string' && ALLOWED.test(t)).slice(0, MAX_TAGS);
  for (const tag of valid) revalidateTag(tag);
  return NextResponse.json({ revalidated: valid });
}
