'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { fromDusdc } from '@deepbookie/predict-client';
import { PLP_TYPE, POLL } from '@/lib/constants';

export interface PlpHolding {
  plpUnits: number; // PLP shares (6dp, same scaling as dUSDC by the vaultValue = supply × price invariant)
  firstCoinId: string | null; // whole-coin withdraw target (v1)
  coinCount: number;
}

/**
 * The connected wallet's PLP (liquidity) holding — path ③ (direct chain, never cached). The first
 * coin id feeds the `withdraw` write (burn-a-PLP-coin); callers invalidate `['plp']` after a write.
 */
export function usePlp() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const owner = account?.address;

  return useQuery<PlpHolding>({
    queryKey: ['plp', owner],
    enabled: !!owner,
    queryFn: async () => {
      const coins = await client.getCoins({ owner: owner!, coinType: PLP_TYPE });
      const total = coins.data.reduce((sum, c) => sum + BigInt(c.balance), 0n);
      return {
        plpUnits: fromDusdc(total),
        firstCoinId: coins.data[0]?.coinObjectId ?? null,
        coinCount: coins.data.length,
      };
    },
    refetchInterval: POLL.balance,
    staleTime: 0,
  });
}
