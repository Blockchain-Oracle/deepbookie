'use client';

import { useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { allTools, getToolsForAdapter, type ToolContext } from '@deepbookie/core';
import { NETWORK } from '@/lib/constants';
import { setStoredBalanceManager } from '@/lib/spot/bmStore';
import { markRedeemed, positionKey } from '@/lib/predict/redeemedStore';
import { clientLogger } from '@/lib/logger.client';

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
  // A settled/expired market is the most common terminal-state abort; check its specific strings BEFORE
  // the generic MoveAbort branch (a settlement abort is itself a MoveAbort whose text names "settled").
  if (m.includes('settled') || m.includes('not active') || m.includes('expired'))
    return 'This market has settled — it can no longer be traded.';
  // On-chain abort (MoveAbort) — check before "manager"/"balance" since the abort string often names them.
  if (m.includes('moveabort') || m.includes('abort'))
    return 'The transaction was rejected on-chain — usually not enough balance, or the market/order changed. Try again.';
  if (m.includes('balance manager') || m.includes('balancemanager'))
    return 'Set up your DeepBook spot account first, then trade.';
  if (m.includes('no dusdc')) return 'No dUSDC in your wallet — fund from the faucet first.';
  if (m.includes('manager')) return 'Create your account first, then place this bet.';
  if (m.includes('insufficient') || m.includes('balance')) return 'Not enough balance to cover this.';
  if (m.includes('timeout') || m.includes('indexer')) return 'Couldn’t reach the market right now — try again.';
  // Unknown failure: the tx may already have broadcast (we sign+execute), so DON'T assert "no funds moved"
  // here — only the wallet-decline branch above can promise that.
  return 'The transaction failed or its result couldn’t be confirmed — check your wallet history before retrying.';
}

type ObjChange = { type: string; objectType?: string; objectId?: string };

/** create-tools whose freshly-created SHARED manager id must be captured from effects (the resolvers
 *  lag/can't-see-shared-objects, so the captured id is the authoritative source — see [[shared-bm…]]). */
const CREATE_CAPTURE: Record<string, { kind: 'predict' | 'balance'; typeSuffix: string }> = {
  spot_create_balance_manager: { kind: 'balance', typeSuffix: 'balance_manager::BalanceManager' },
  create_manager: { kind: 'predict', typeSuffix: 'predict_manager::PredictManager' },
};

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

      // A successful redeem closes the position on-chain, but the indexer lags ~7s and keeps returning
      // it. Mark it now so every RedeemButton (chat card AND positions page) goes terminal immediately —
      // a second "Sell now" on an already-closed position would MoveAbort (decrease_position, code 1).
      if (toolName === 'redeem' || toolName === 'redeem_range') {
        markRedeemed(qc, positionKey(safeInput));
      }

      // Capture the freshly-created SHARED manager id (PredictManager OR BalanceManager): the resolvers
      // lag (indexer) or can't see shared objects at all, so this captured id is the authoritative
      // source for later actions + reloads. Retry on a flaky/cold-start RPC so a transient
      // waitForTransaction failure can't strand the id → a duplicate-create nag → orphaned funds.
      const cap = CREATE_CAPTURE[toolName];
      if (cap) {
        let captured: string | null = null;
        let lastErr: unknown;
        for (let attempt = 0; attempt < 3 && !captured; attempt++) {
          try {
            const tb = await client.waitForTransaction({ digest, options: { showObjectChanges: true } });
            const created = (tb.objectChanges as ObjChange[] | undefined)?.find(
              (c) => c.type === 'created' && c.objectType?.includes(cap.typeSuffix),
            );
            if (created?.objectId) captured = created.objectId;
          } catch (e) {
            lastErr = e; // keep the last cause so the final warn names WHY
          }
        }
        if (captured) {
          // Durable server-side capture (DB-first resolution) — AWAIT so the very next chat turn /
          // action resolves the manager instead of nagging "create one".
          await fetch('/api/manager-capture', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ owner, kind: cap.kind, managerId: captured }),
          }).catch((e) => clientLogger.warn('manager capture POST failed', { err: e instanceof Error ? e.message : String(e) }));
          if (cap.kind === 'balance') {
            // Same-device instant source (the resolver can't find a shared BM): localStorage + cache.
            setStoredBalanceManager(owner, captured);
            qc.setQueryData(['balanceManager', owner], { balanceManagerId: captured });
          }
          // predict: the bustCaches below invalidates ['positions'] → refetch resolves it DB-first.
        } else {
          clientLogger.warn('manager id capture failed after retries — id unrecoverable this session', {
            digest,
            owner,
            kind: cap.kind,
            err: lastErr instanceof Error ? lastErr.message : lastErr ? String(lastErr) : undefined,
          });
          // BalanceManager only: seed an error so the panel shows Retry (never "Create" → no duplicate).
          if (cap.kind === 'balance') qc.setQueryData(['balanceManager', owner], { balanceManagerId: null, error: true });
        }
      }

      // Refresh now (responsive), then again after finality lands (fresh chain state). Both non-blocking,
      // but log on failure so a chronically-failing revalidate/finality (→ stale data pages) isn't silent.
      bustCaches(qc);
      void fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tags: ['markets', 'activity', 'spot', ...(ids.managerId ? [`manager:${ids.managerId}`] : [])] }),
      }).catch((e) => clientLogger.warn('post-write revalidate failed', { err: e instanceof Error ? e.message : String(e) }));
      void client
        .waitForTransaction({ digest })
        .then(() => bustCaches(qc))
        .catch((e) => clientLogger.warn('post-write finality wait failed', { err: e instanceof Error ? e.message : String(e) }));

      return digest;
    },
    [account, client, signAndExecute, qc],
  );
}
