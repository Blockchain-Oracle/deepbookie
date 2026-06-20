'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react';
import { allTools, getToolsForAdapter, type ToolContext } from '@deepbookie/core';
import { NETWORK } from '@/lib/constants';
import type { Direction, Quote } from '@/lib/bff/types';

export interface QuoteInput {
  oracleId: string;
  strikeUsd: number;
  direction: Direction;
  quantityUsd: number;
}

/** Exact pre-sign quote — path ③ (on-chain devInspect via the wallet's client; never cached). */
export function useQuote(input?: QuoteInput) {
  const client = useCurrentClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ['quote', input?.oracleId, input?.strikeUsd, input?.direction, input?.quantityUsd],
    enabled: !!input && !!account,
    queryFn: async () => {
      const ctx: ToolContext = { client, network: NETWORK, sender: account!.address };
      return getToolsForAdapter(allTools, ctx).read('get_quote', input!) as Promise<Quote>;
    },
    staleTime: 5_000,
  });
}
