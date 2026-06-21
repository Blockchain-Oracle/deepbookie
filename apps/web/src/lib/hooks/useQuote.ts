'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { allTools, getToolsForAdapter, type ToolContext } from '@deepbookie/core';
import { NETWORK } from '@/lib/constants';
import type { Direction, Quote } from '@/lib/bff/types';

export interface QuoteInput {
  oracleId: string;
  strikeUsd: number;
  direction: Direction;
  quantityUsd: number;
}

/** Exact pre-sign quote — path ③ (on-chain devInspect via the wallet's client; never cached). A
 *  longer `staleTime` suits a fixed value (e.g. a settled position's payout doesn't move). */
export function useQuote(input?: QuoteInput, opts?: { staleTime?: number }) {
  const client = useSuiClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ['quote', input?.oracleId, input?.strikeUsd, input?.direction, input?.quantityUsd],
    enabled: !!input && !!account,
    queryFn: async () => {
      const ctx: ToolContext = {
        client: client as unknown as SuiJsonRpcClient,
        network: NETWORK,
        sender: account!.address,
      };
      return getToolsForAdapter(allTools, ctx).read('get_quote', input!) as Promise<Quote>;
    },
    staleTime: opts?.staleTime ?? 5_000,
  });
}
