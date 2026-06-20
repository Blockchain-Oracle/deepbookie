import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Bust server-cache tags after a signed write so the next read reflects chain. */
export async function POST(req: Request) {
  let tags: string[] = [];
  try {
    tags = ((await req.json()) as { tags?: string[] }).tags ?? [];
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  for (const tag of tags) revalidateTag(tag);
  return NextResponse.json({ revalidated: tags });
}
