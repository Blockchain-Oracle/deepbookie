/** 0x7a3f…4e21 — the address/id treatment used everywhere in the design. */
export function formatAddress(addr?: string | null, lead = 6, tail = 4): string {
  if (!addr) return '';
  if (addr.length <= lead + tail + 1) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

export function shortenDigest(digest: string, lead = 8, tail = 6): string {
  return formatAddress(digest, lead, tail);
}

/** Tabular dollar figure, e.g. 1,284.91. */
export function formatUsd(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Percent from a 0..1 probability, e.g. 53.8%. */
export function formatPct(p: number, decimals = 1): string {
  return `${(p * 100).toFixed(decimals)}%`;
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
