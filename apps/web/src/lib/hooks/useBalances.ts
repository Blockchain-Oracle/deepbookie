import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react';
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { fromDusdc } from '@deepbookie/predict-client';
import { DUSDC_TYPE, POLL } from '@/lib/constants';

const SUI_DECIMALS = 9;

/**
 * Live wallet balances — path ③ (direct chain, never cached). Polls so the chip never looks
 * stale; callers invalidate `['balance']` after a signed write or a faucet grant.
 */
export function useBalances() {
  const account = useCurrentAccount();
  const client = useCurrentClient() as unknown as SuiJsonRpcClient;
  const owner = account?.address;

  const dusdc = useQuery({
    queryKey: ['balance', owner, 'dusdc'],
    enabled: !!owner,
    queryFn: async () => {
      const res = await client.getBalance({ owner: owner!, coinType: DUSDC_TYPE });
      return fromDusdc(Number(res.totalBalance));
    },
    refetchInterval: POLL.balance,
    staleTime: 0,
  });

  const sui = useQuery({
    queryKey: ['balance', owner, 'sui'],
    enabled: !!owner,
    queryFn: async () => {
      const res = await client.getBalance({ owner: owner! });
      return Number(res.totalBalance) / 10 ** SUI_DECIMALS;
    },
    refetchInterval: POLL.balance,
    staleTime: 0,
  });

  return { owner, dusdc, sui };
}
