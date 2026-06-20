'use client';

import { useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
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
  // On-chain abort (MoveAbort) — check before "manager"/"balance" since the abort string often names them.
  if (m.includes('moveabort') || m.includes('abort'))
    return 'The transaction was rejected on-chain — usually not enough balance, or the market/order changed. Try again.';
  if (m.includes('balance manager') || m.includes('balancemanager'))
    return 'Set up your DeepBook spot account first, then trade.';
  if (m.includes('no dusdc')) return 'No dUSDC in your wallet — fund from the faucet first.';
  if (m.includes('manager')) return 'Create your account first, then place this bet.';
  if (m.includes('insufficient') || m.includes('balance')) return 'Not enough balance to cover this.';
  if (m.includes('settled') || m.includes('not active') || m.includes('expired'))
    return 'This market has settled — it can no longer be traded.';
  if (m.includes('timeout') || m.includes('indexer')) return 'Couldn’t reach the market right now — try again.';
  return 'The transaction failed. No funds moved.';
}

type ObjChange = { type: string; objectType?: string; objectId?: string };

/** Bust the caches a write can affect, so balances/positions/spot reflect chain. */
function bustCaches(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['balance'] });
  qc.invalidateQueries({ queryKey: ['positions'] });
  qc.invalidateQueries({ queryKey: ['balanceManager'] });
  qc.invalidateQueries({ queryKey: ['spotAccount'] });
  qc.invalidateQueries({ queryKey: ['spot'] });
}

/**
 * The keyless sign handshake: build the unsigned tx with the SAME core write `build()` (browser
 * ToolContext wrapping the wallet's client), sign in the wallet, and report the digest. We do NOT
 * block the receipt on finality — the wallet has already executed the tx, so a slow testnet RPC index
 * must never keep the card stuck on "Confirm in your wallet…". The wait + cache-bust run in the
 * background. Returns the digest; throws on failure (caller renders the FAILED receipt via reasonFor).
 */
export function useSubmitTx() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const qc = useQueryClient();

  return useCallback(
    async (
      toolName: string,
      input: Record<string, unknown>,
      ids: { managerId?: string; balanceManagerId?: string } = {},
    ): Promise<string> => {
      if (!account) throw new Error('wallet not connected');
      const owner = account.address;
      const ctx: ToolContext = {
        client: client as unknown as SuiJsonRpcClient,
        network: NETWORK,
        sender: owner,
        managerId: ids.managerId,
        balanceManagerId: ids.balanceManagerId,
      };
      // Never trust an agent-supplied manager id (it sometimes proposes "AUTO"); the wallet-resolved
      // ctx ids are authoritative. Strip both from the proposed input before building.
      const { managerId: _m, balanceManagerId: _b, ...safeInput } = input;
      const tx = await getToolsForAdapter(allTools, ctx).build(toolName, safeInput);
      const { digest } = await signAndExecute({ transaction: tx });

      // Capturing a freshly-created BalanceManager id is the ONE thing we wait for — so the very next
      // spot action (deposit/swap) has it immediately, instead of failing "set up your account first"
      // while the resolver lags. Bounded by waitForTransaction's own timeout; never fatal.
      if (toolName === 'spot_create_balance_manager') {
        try {
          const tb = await client.waitForTransaction({ digest, options: { showObjectChanges: true } });
          const created = (tb.objectChanges as ObjChange[] | undefined)?.find(
            (c) => c.type === 'created' && c.objectType?.includes('balance_manager::BalanceManager'),
          );
          if (created?.objectId) qc.setQueryData(['balanceManager', owner], { balanceManagerId: created.objectId });
        } catch {
          /* fall back to the resolver refetch below */
        }
      }

      // Refresh now (responsive), then again after finality lands (fresh chain state). Both non-blocking.
      bustCaches(qc);
      void fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tags: ['markets', 'activity', 'spot', ...(ids.managerId ? [`manager:${ids.managerId}`] : [])] }),
      }).catch(() => {});
      void client
        .waitForTransaction({ digest })
        .then(() => bustCaches(qc))
        .catch(() => {});

      return digest;
    },
    [account, client, signAndExecute, qc],
  );
}
