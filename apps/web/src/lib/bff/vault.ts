import { REVALIDATE, VAULT_PERF_MAX_POINTS } from '@/lib/constants';
import { cachedRead } from './read';
import type { Vault, VaultHistory, VaultHistoryPoint } from './types';

/** Evenly subsample a long series to ~max points (the indexer returns 1000+). */
function downsample(points: VaultHistoryPoint[], max: number): VaultHistoryPoint[] {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out: VaultHistoryPoint[] = [];
  for (let i = 0; i < max; i += 1) out.push(points[Math.floor(i * step)]!);
  const last = points[points.length - 1]!;
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

export function getVault() {
  return cachedRead<Vault>('get_vault', {}, { revalidate: REVALIDATE.vault, tags: ['vault'] });
}

export async function getVaultHistory(): Promise<VaultHistory> {
  const full = await cachedRead<VaultHistory>(
    'get_vault_history',
    {},
    { revalidate: REVALIDATE.vaultPerf, tags: ['vault'] },
  );
  return { range: full.range, points: downsample(full.points, VAULT_PERF_MAX_POINTS) };
}
