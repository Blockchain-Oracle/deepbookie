import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { fromDusdc } from '@deepbookie/predict-client';
import { DUSDC_TYPE, POLL, SUI_DECIMALS } from '@/lib/constants';

/**
 * Live wallet balances — path ③ (direct chain, never cached). Polls so the chip never looks
 * stale; callers invalidate `['balance']` after a signed write or a faucet grant.
 */
export function useBalances() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const owner = account?.address;

  const dusdc = useQuery({
    queryKey: ['balance', owner, 'dusdc'],
    enabled: !!owner,
    queryFn: async () => {
      const res = await client.getBalance({ owner: owner!, coinType: DUSDC_TYPE });
      return fromDusdc(BigInt(res.totalBalance));
    },
    refetchInterval: POLL.balance,
    staleTime: 0,
  });

  const sui = useQuery({
    queryKey: ['balance', owner, 'sui'],
    enabled: !!owner,
    queryFn: async () => {
      const res = await client.getBalance({ owner: owner! });
      return Number(BigInt(res.totalBalance)) / 10 ** SUI_DECIMALS;
    },
    refetchInterval: POLL.balance,
    staleTime: 0,
  });

  return { owner, dusdc, sui };
}
