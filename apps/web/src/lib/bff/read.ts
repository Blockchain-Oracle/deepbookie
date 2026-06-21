import { unstable_cache } from 'next/cache';
import { allTools, createContext, getToolsForAdapter } from '@deepbookie/core';
import { INDEXER_RETRIES, INDEXER_TIMEOUT_MS, NETWORK, REVALIDATE } from '@/lib/constants';

/**
 * The data BFF reads through the SAME core read-tool registry the agent uses — one source of truth
 * for every DTO, so the data pages and the chat widgets never disagree. Server-only.
 */
function api() {
  return getToolsForAdapter(allTools, createContext({ network: NETWORK }));
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('indexer timeout')), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/** Read a core tool with timeout + retry (indexer cold-starts can spike to 5–20s). Uncached. */
export function readTool<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  return withRetry(
    () => withTimeout(api().read(name, args) as Promise<T>, INDEXER_TIMEOUT_MS),
    INDEXER_RETRIES,
  );
}

/** Cached read — Next data cache (revalidate seconds + tags for on-demand busting after writes). */
export function cachedRead<T>(
  name: string,
  args: Record<string, unknown>,
  opts: { revalidate: number; tags: string[] },
): Promise<T> {
  return unstable_cache(() => readTool<T>(name, args), ['bff', name, JSON.stringify(args)], {
    revalidate: opts.revalidate,
    tags: opts.tags,
  })();
}

/** Wrap a request-scoped read (one that needs the wallet/manager ctx, so it can't be shared-cached)
 *  with the same timeout + retry the cached path gets — keeps wallet reads from hanging the chat. */
export function withReliability<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(() => withTimeout(fn(), INDEXER_TIMEOUT_MS), INDEXER_RETRIES);
}

/**
 * Catalog/book reads that are the SAME for every user → safe to share-cache (and cheap to repeat in
 * chat). Wallet-scoped reads (positions, spot account/balance/orders, can-place, live quotes) are
 * deliberately absent: they run request-scoped via `withReliability` so they stay fresh + per-wallet.
 */
const AI_CACHEABLE: Record<string, { revalidate: number; tags: string[] }> = {
  list_markets: { revalidate: REVALIDATE.markets, tags: ['markets'] },
  get_market: { revalidate: REVALIDATE.markets, tags: ['markets'] },
  get_odds: { revalidate: REVALIDATE.curve, tags: ['markets'] },
  get_vault: { revalidate: REVALIDATE.vault, tags: ['markets'] },
  get_vault_history: { revalidate: REVALIDATE.vaultPerf, tags: ['markets'] },
  get_recent_bets: { revalidate: REVALIDATE.activity, tags: ['activity'] },
  spot_list_pools: { revalidate: REVALIDATE.spotPools, tags: ['spot'] },
  spot_pool_params: { revalidate: REVALIDATE.spotPools, tags: ['spot'] },
  spot_mid_price: { revalidate: REVALIDATE.spotBook, tags: ['spot'] },
  spot_orderbook: { revalidate: REVALIDATE.spotBook, tags: ['spot'] },
};

/**
 * The chat read path. Shareable catalog reads hit the Next data cache (instant on repeat, with the
 * 22s timeout + retry baked in) — fixing the "Couldn't load list markets" hang where chat hit the
 * raw 2.2MB `/oracles` uncached. Everything else still gets timeout + retry via `readTool`.
 */
export function cachedAiRead<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const c = AI_CACHEABLE[name];
  return c ? cachedRead<T>(name, args, c) : readTool<T>(name, args);
}
