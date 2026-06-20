'use client';

import { useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useQueryClient } from '@tanstack/react-query';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { allTools, getToolsForAdapter, type ToolContext } from '@deepbookie/core';
import { NETWORK } from '@/lib/constants';

/** A wallet decline (user rejected the popup) — a cancellation, not a failure. */
export function isUserRejection(e: unknown): boolean {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return m.includes('reject') || m.includes('denied') || m.includes('cancel');
}

/** Map a thrown build/sign error to a user-facing reason (the FAILED receipt shows this). */
export function reasonFor(e: unknown): string {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  if (m.includes('reject') || m.includes('denied') || m.includes('cancel'))
    return 'Signature declined in your wallet. No funds moved.';
  if (m.includes('no dusdc')) return 'No dUSDC in your wallet — fund from the faucet first.';
  if (m.includes('manager')) return 'Create your account first, then place this bet.';
  if (m.includes('insufficient') || m.includes('balance')) return 'Not enough balance to cover this bet.';
  if (m.includes('settled') || m.includes('not active') || m.includes('expired'))
    return 'This market has settled — it can no longer be traded.';
  if (m.includes('timeout') || m.includes('indexer')) return 'Couldn’t reach the market right now — try again.';
  return 'The transaction failed. No funds moved.';
}

/**
 * The keyless sign handshake: build the unsigned tx with the SAME core write `build()` (browser
 * ToolContext wrapping the wallet's client), sign in the wallet, wait for finality, invalidate
 * caches. Returns the digest; throws on failure (caller renders the FAILED receipt via reasonFor).
 */
export function useSubmitTx() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const qc = useQueryClient();

  return useCallback(
    async (toolName: string, input: Record<string, unknown>, managerId?: string): Promise<string> => {
      if (!account) throw new Error('wallet not connected');
      // The browser client (SuiClient) exposes the same getCoins/devInspect surface the builders need.
      const ctx: ToolContext = {
        client: client as unknown as SuiJsonRpcClient,
        network: NETWORK,
        sender: account.address,
        managerId,
      };
      // Never trust an agent-supplied managerId (it sometimes proposes "AUTO"); the wallet-resolved
      // ctx.managerId is authoritative. Strip it from the proposed input before building.
      const { managerId: _ignored, ...safeInput } = input;
      const tx = await getToolsForAdapter(allTools, ctx).build(toolName, safeInput);
      const { digest } = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest });

      // Bust server tags + client caches so balances/positions reflect chain immediately.
      const tags = ['markets', 'activity', ...(managerId ? [`manager:${managerId}`] : [])];
      void fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tags }),
      }).catch(() => {});
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['positions'] });

      return digest;
    },
    [account, client, signAndExecute, qc],
  );
}
