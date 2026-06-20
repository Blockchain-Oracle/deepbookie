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
