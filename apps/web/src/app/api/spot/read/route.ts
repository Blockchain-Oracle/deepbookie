import { NextResponse } from 'next/server';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { allTools, createContext, getToolsForAdapter } from '@deepbookie/core';
import { withReliability } from '@/lib/bff/read';
import { resolveBalanceManagerByOwner } from '@/lib/bff/spot';
import { CHAT_RATE_WINDOW_MS, NETWORK, SPOT_READ_RATE_PER_IP } from '@/lib/constants';
import { allowRequest, clientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Spot reads the widgets may proxy through the server (where the SDK's `core.simulateTransaction`
// devInspect is guaranteed). Writes are NEVER here — they build + sign in the browser.
// DERIVED from the registry (single source of truth): the allowlist is exactly the spot READ tools, so
// a future write can never accidentally become reachable here, and a new read is whitelisted by
// construction. spot_can_place_market_order is kept out of the WEB surface (no market-order UI; matches
// the agent EXCLUDED set in ai/tools.ts).
const WEB_EXCLUDED_READS = new Set(['spot_can_place_market_order']);
const ALLOWED = new Set(
  allTools
    .filter((t) => t.surface === 'spot' && t.kind === 'read' && !WEB_EXCLUDED_READS.has(t.name))
    .map((t) => t.name),
);

// These reads inspect the wallet's BalanceManager, so they need it resolved into the ctx.
const BM_SCOPED = new Set([
  'spot_balance',
  'spot_account',
  'spot_open_orders',
  'spot_can_place_limit_order',
]);

/** Generic spot read proxy: validates the tool, resolves the BalanceManager for account reads, runs
 *  the same core read tool the agent uses (timeout + retry). `owner` is a quote/account convenience,
 *  never authorization. */
export async function POST(req: Request) {
  if (!allowRequest(`spotread:${clientIp(req)}`, SPOT_READ_RATE_PER_IP, CHAT_RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  let tool: string | undefined;
  try {
    const body = (await req.json()) as {
      tool?: string;
      args?: Record<string, unknown>;
      owner?: string;
      balanceManagerId?: string;
    };
    tool = body.tool;
    if (!tool || !ALLOWED.has(tool)) {
      return NextResponse.json({ error: 'unknown spot read' }, { status: 400 });
    }
    // `owner` is a quote/inspection convenience (never auth), but validate its shape before it's used
    // as the devInspect sender / resolver key.
    if (body.owner && !isValidSuiAddress(body.owner)) {
      return NextResponse.json({ error: 'invalid owner' }, { status: 400 });
    }
    // A client-supplied balanceManagerId flows into the SDK devInspect — validate its shape too so a
    // malformed id yields a clean 400 instead of a masked 502 from the SDK.
    if (body.balanceManagerId && !isValidSuiAddress(body.balanceManagerId)) {
      return NextResponse.json({ error: 'invalid balance manager' }, { status: 400 });
    }
    let balanceManagerId: string | null = null;
    if (BM_SCOPED.has(tool)) {
      // Prefer the client-provided id (captured at creation, localStorage-backed) — the on-chain
      // resolver can't find shared BalanceManagers. Fall back to it only if the client didn't send one.
      // NOTE: this is an INSPECTION PROXY over PUBLIC on-chain state — a BalanceManager is a shared
      // object whose orders/stake/rebates anyone can read directly via devInspect. We intentionally
      // do not verify the id belongs to `owner` (which is impossible for shared BMs anyway); this is
      // NOT an authorization boundary and exposes nothing not already public. Writes never run here.
      // No `.catch` here: a resolver THROW (transient RPC failure) must propagate to the outer
      // try/catch → 502 'unavailable', distinct from a genuine null (no BM) → 409, so the UI can tell
      // "couldn't reach the resolver, retry" apart from "you have no spot account".
      balanceManagerId =
        body.balanceManagerId ?? (body.owner ? await resolveBalanceManagerByOwner(body.owner) : null);
      if (!balanceManagerId) return NextResponse.json({ error: 'no balance manager' }, { status: 409 });
    }
    const ctx = createContext({
      network: NETWORK,
      sender: body.owner,
      balanceManagerId: balanceManagerId ?? undefined,
    });
    const data = await withReliability(() => getToolsForAdapter(allTools, ctx).read(tool!, body.args ?? {}));
    return NextResponse.json(data);
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err), tool }, 'POST /api/spot/read');
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
