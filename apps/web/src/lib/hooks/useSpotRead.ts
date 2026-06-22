'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { SPOT_COINS } from '@deepbookie/core';
import { POLL } from '@/lib/constants';
import { apiPost } from './client';
import { useBalanceManager } from './useBalanceManager';

/** coinKey → { coinType, scalar } from the SDK testnet catalog — the source of truth for reading a
 *  wallet's coin balance DIRECTLY (independent of any BalanceManager read). */
const COIN_CATALOG = SPOT_COINS as Record<string, { type: string; scalar: number }>;
import type {
  SpotAccount,
  SpotCanPlace,
  SpotCoinBalance,
  SpotMid,
  SpotOpenOrder,
  SpotPoolParams,
  SpotSwapQuote,
} from '@/lib/bff/spot-types';

interface SpotReadOpts {
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
  // Pass the captured BalanceManager id so account-scoped reads work (the server can't resolve it).
  const balanceManagerId = useBalanceManager(owner).data?.balanceManagerId ?? null;
  return useQuery<T>({
    queryKey: ['spot', tool, args ?? null, owner ?? null, balanceManagerId],
    enabled: args !== undefined,
    queryFn: () => apiPost<T>('/api/spot/read', { tool, args, owner, balanceManagerId }),
    refetchInterval: opts.refetchInterval,
    staleTime: opts.staleTime ?? 4_000,
  });
}

// ── Typed convenience wrappers ───────────────────────────────────────────────
// NOTE: spot_list_pools / spot_orderbook have NO hook wrappers — that data flows from the agent's
// streamed tool output (MessagePart → SpotPoolTable / OrderbookDepth), not a client-initiated read.
export const useSpotMid = (poolKey?: string, opts?: SpotReadOpts) =>
  useSpotRead<SpotMid>('spot_mid_price', poolKey ? { poolKey } : undefined, opts);

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

/** The connected wallet's free balance of a coin (what's available to DEPOSIT), read DIRECTLY from
 *  chain using the coin's KNOWN type from the SDK catalog — NOT derived from a BalanceManager read.
 *  (Deriving it from the BM read returned 0 whenever the BM was empty/unresolved, even though the
 *  wallet held the coin.) `undefined` coinKey, or an unknown coin, disables it. */
export function useWalletCoinBalance(coinKey?: string) {
  const owner = useCurrentAccount()?.address;
  const client = useSuiClient();
  const coin = coinKey ? COIN_CATALOG[coinKey] : undefined;
  return useQuery({
    queryKey: ['walletCoin', owner ?? null, coin?.type ?? null],
    enabled: !!owner && !!coin,
    queryFn: async () => {
      const bal = await client.getBalance({ owner: owner!, coinType: coin!.type });
      return Number(BigInt(bal.totalBalance)) / coin!.scalar;
    },
    refetchInterval: POLL.balance,
    staleTime: 4_000,
  });
}

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
