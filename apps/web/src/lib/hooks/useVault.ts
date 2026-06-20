import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '@/lib/constants';
import { apiGet } from './client';
import type { Vault, VaultHistory } from '@/lib/bff/types';

export function useVault() {
  return useQuery({
    queryKey: ['vault'],
    queryFn: () => apiGet<Vault>('/api/vault'),
    refetchInterval: POLL.vault,
    staleTime: STALE.vault,
    placeholderData: keepPreviousData,
  });
}

export function useVaultHistory() {
  return useQuery({
    queryKey: ['vaultHistory'],
    queryFn: () => apiGet<VaultHistory>('/api/vault/performance'),
    refetchInterval: POLL.vault,
    staleTime: STALE.vault,
    placeholderData: keepPreviousData,
  });
}
