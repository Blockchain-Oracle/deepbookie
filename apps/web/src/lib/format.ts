/** Defensive coercers for agent-supplied tool input (shared across the spot write cards). */
export const num = (v: unknown): number => (typeof v === 'number' ? v : 0);
export const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Receipt doc-number, e.g. DB·A1B2·9F3C — one source for the format used on every sign receipt. */
export const docNumberFor = (id: string): string => `DB·${id.slice(0, 4).toUpperCase()}·${id.slice(-4)}`;

/** SUI_DBUSDC → { base: "SUI", quote: "DBUSDC", pair: "SUI/DBUSDC" } (pair falls back to the raw key). */
export function splitPool(poolKey: string): { base: string; quote: string; pair: string } {
  const [base = '', quote = ''] = poolKey.split('_');
  return { base, quote, pair: base && quote ? `${base}/${quote}` : poolKey };
}

/** SUI_DBUSDC → "SUI/DBUSDC" (display label). */
export const poolLabel = (poolKey: string): string => poolKey.replace(/_/g, '/');

/** 0x7a3f…4e21 — the address/id treatment used everywhere in the design. */
export function formatAddress(addr?: string | null, lead = 6, tail = 4): string {
  if (!addr) return '';
  if (addr.length <= lead + tail + 1) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

export function shortenDigest(digest: string, lead = 8, tail = 6): string {
  return formatAddress(digest, lead, tail);
}

/** Tabular dollar figure, e.g. 1,284.91. Null/undefined/NaN coerce to 0 — a display formatter must
 *  never crash the render (a null exit-value once threw `null.toLocaleString` and white-screened the app). */
export function formatUsd(value: number | null | undefined, decimals = 2): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Percent from a 0..1 probability, e.g. 53.8%. */
export function formatPct(p: number, decimals = 1): string {
  return `${(p * 100).toFixed(decimals)}%`;
}

/** Spot price/amount with a precision ladder: 2dp ≥1000, 4dp ≥1, else 4 significant figures so a tiny
 *  value (e.g. a sub-1e-4 DBTC amount) doesn't collapse to "0.0000". `empty` shows for a non-positive
 *  value — pass "—" for a missing read, "0" for a genuine zero. */
export function formatSpotPrice(n: number, empty = '—'): string {
  if (!(n > 0)) return empty;
  if (n >= 1000) return formatUsd(n, 2);
  if (n >= 1) return formatUsd(n, 4);
  return n.toPrecision(4);
}

/** Time-to-expiry as "27m" or "1h 12m" (0 when past). */
export function formatCountdown(expiryMs: number, nowMs = Date.now()): string {
  const mins = Math.max(0, Math.round((expiryMs - nowMs) / 60_000));
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** Compact strike label for axes, e.g. $63k. */
export function formatStrikeShort(usd: number): string {
  return usd >= 1000 ? `$${(usd / 1000).toFixed(usd % 1000 === 0 ? 0 : 1)}k` : `$${usd.toFixed(0)}`;
}

/** Absolute settlement time, e.g. "Jun 20, 4:15 PM" — the per-market differentiator. */
export function formatSettleTime(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
