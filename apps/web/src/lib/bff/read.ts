import { unstable_cache } from 'next/cache';
import { allTools, createContext, getToolsForAdapter } from '@deepbookie/core';
import { INDEXER_RETRIES, INDEXER_TIMEOUT_MS, NETWORK } from '@/lib/constants';

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
