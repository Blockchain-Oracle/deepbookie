import { NextResponse } from 'next/server';
import { allTools, createContext, getToolsForAdapter } from '@deepbookie/core';
import { withReliability } from '@/lib/bff/read';
import { resolveBalanceManagerByOwner } from '@/lib/bff/spot';
import { NETWORK } from '@/lib/constants';
import { logger } from '@/lib/logger.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Spot reads the widgets may proxy through the server (where the SDK's `core.simulateTransaction`
// devInspect is guaranteed). Writes are NEVER here — they build + sign in the browser. Whitelist.
const ALLOWED = new Set([
  'spot_list_pools',
  'spot_mid_price',
  'spot_orderbook',
  'spot_swap_quote',
  'spot_pool_params',
  'spot_balance',
  'spot_account',
  'spot_open_orders',
  'spot_can_place_limit_order',
  'spot_can_place_market_order',
]);

// These reads inspect the wallet's BalanceManager, so they need it resolved into the ctx.
const BM_SCOPED = new Set([
  'spot_balance',
  'spot_account',
  'spot_open_orders',
  'spot_can_place_limit_order',
  'spot_can_place_market_order',
]);

/** Generic spot read proxy: validates the tool, resolves the BalanceManager for account reads, runs
 *  the same core read tool the agent uses (timeout + retry). `owner` is a quote/account convenience,
 *  never authorization. */
export async function POST(req: Request) {
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
    let balanceManagerId: string | null = null;
    if (BM_SCOPED.has(tool)) {
      // Prefer the client-provided id (captured at creation, localStorage-backed) — the on-chain
      // resolver can't find shared BalanceManagers. Fall back to it only if the client didn't send one.
      balanceManagerId =
        body.balanceManagerId ?? (body.owner ? await resolveBalanceManagerByOwner(body.owner).catch(() => null) : null);
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
