'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { apiPost } from './client';
import type {
  SpotAccount,
  SpotCanPlace,
  SpotCoinBalance,
  SpotMid,
  SpotOpenOrder,
  SpotOrderbook,
  SpotPool,
  SpotPoolParams,
  SpotSwapQuote,
} from '@/lib/bff/spot-types';

interface SpotReadOpts {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

/**
 * Read a spot tool via the server proxy (`/api/spot/read`) — the SDK's devInspect needs the
 * server's RPC client. Keyed under `['spot', …]` so a signed write (which invalidates `['spot']`)
 * refetches it. `args === undefined` disables the query (so widgets gate on user input).
 */
export function useSpotRead<T>(tool: string, args: Record<string, unknown> | undefined, opts: SpotReadOpts = {}) {
  const owner = useCurrentAccount()?.address;
  return useQuery<T>({
    queryKey: ['spot', tool, args ?? null, owner ?? null],
    enabled: (opts.enabled ?? true) && args !== undefined,
    queryFn: () => apiPost<T>('/api/spot/read', { tool, args, owner }),
    refetchInterval: opts.refetchInterval,
    staleTime: opts.staleTime ?? 4_000,
  });
}

// ── Typed convenience wrappers ───────────────────────────────────────────────
export const useSpotPools = (opts?: SpotReadOpts) =>
  useSpotRead<SpotPool[]>('spot_list_pools', {}, { staleTime: 60_000, ...opts });

export const useSpotMid = (poolKey?: string, opts?: SpotReadOpts) =>
  useSpotRead<SpotMid>('spot_mid_price', poolKey ? { poolKey } : undefined, opts);

export const useSpotOrderbook = (poolKey?: string, ticks?: number, opts?: SpotReadOpts) =>
  useSpotRead<SpotOrderbook>(
    'spot_orderbook',
    poolKey ? { poolKey, ...(ticks ? { ticks } : {}) } : undefined,
    { refetchInterval: 4_000, ...opts },
  );

export const useSpotPoolParams = (poolKey?: string, opts?: SpotReadOpts) =>
  useSpotRead<SpotPoolParams>('spot_pool_params', poolKey ? { poolKey } : undefined, {
    staleTime: 60_000,
    ...opts,
  });

/** Swap preview. Pass exactly one of baseQuantity / quoteQuantity (>0); undefined disables it. */
export function useSpotSwapQuote(
  input?: { poolKey: string; baseQuantity?: number; quoteQuantity?: number },
  opts?: SpotReadOpts,
) {
  const enabled = !!input && ((input.baseQuantity ?? 0) > 0 || (input.quoteQuantity ?? 0) > 0);
  return useSpotRead<SpotSwapQuote>('spot_swap_quote', enabled ? input : undefined, { staleTime: 2_000, ...opts });
}

export const useSpotBalance = (coinKey?: string, opts?: SpotReadOpts) =>
  useSpotRead<SpotCoinBalance>('spot_balance', coinKey ? { coinKey } : undefined, opts);

export const useSpotAccount = (poolKey?: string, opts?: SpotReadOpts) =>
  useSpotRead<SpotAccount>('spot_account', poolKey ? { poolKey } : undefined, opts);

export const useSpotOpenOrders = (poolKey?: string, opts?: SpotReadOpts) =>
  useSpotRead<SpotOpenOrder[]>('spot_open_orders', poolKey ? { poolKey } : undefined, {
    refetchInterval: 6_000,
    ...opts,
  });

/** Pre-flight limit-order validity (gates the order ticket CTA). */
export function useSpotCanPlaceLimit(
  input?: { poolKey: string; price: number; quantity: number; isBid: boolean; payWithDeep?: boolean },
  opts?: SpotReadOpts,
) {
  const enabled = !!input && input.price > 0 && input.quantity > 0;
  return useSpotRead<SpotCanPlace>('spot_can_place_limit_order', enabled ? input : undefined, {
    staleTime: 2_000,
    ...opts,
  });
}
