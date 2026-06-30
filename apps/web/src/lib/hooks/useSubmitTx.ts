'use client';

import { useCallback } from 'react';
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiAddress, toBase64 } from '@mysten/sui/utils';
import { allTools, getToolsForAdapter, type ToolContext } from '@deepbookie/core';
import { NETWORK, SPONSOR_ENABLED } from '@/lib/constants';
import { setStoredBalanceManager } from '@/lib/spot/bmStore';
import { markRedeemed, positionKey } from '@/lib/predict/redeemedStore';
import { clientLogger } from '@/lib/logger.client';
import { isUserRejection } from '@/lib/diagnose';

// Diagnosis lives in lib/diagnose.ts now — re-export here so existing call sites keep working
// during the migration; new code should import from '@/lib/diagnose' directly.
export { diagnose, isUserRejection, reasonFor } from '@/lib/diagnose';
export type { Diagnosis, DiagnosisCode } from '@/lib/diagnose';

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
async function postJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

/**
 * Gasless path (Slice B): build the tx-kind only, have Enoki sponsor the gas, sign the sponsored
 * bytes in the wallet (sign-only — no gas), then execute via Enoki. Works for any wallet incl. a
 * fresh zkLogin/Google address with 0 SUI. Returns the on-chain digest.
 */
/** Every move-call target this tx invokes, normalized — Enoki's sponsor allowlist must exact-match
 *  (fully-padded addresses) the calls in the tx, so we derive it straight from the tx itself. */
function moveCallTargets(tx: Transaction): string[] {
  const targets = tx
    .getData()
    .commands.flatMap((c) =>
      c.MoveCall ? [`${normalizeSuiAddress(c.MoveCall.package)}::${c.MoveCall.module}::${c.MoveCall.function}`] : [],
    );
  return [...new Set(targets)];
}

/**
 * Tools that must NOT be sponsored — they move SUI as an input, which on Sui is fundamentally
 * incompatible with sponsorship: the DeepBook SDK sources SUI via `coinWithBalance` → splits from
 * `tx.gas`, but in a sponsored tx `tx.gas` belongs to the SPONSOR. Enoki (correctly) rejects.
 * The user has SUI from the faucet, so user-pays-gas works fine for these.
 */
const SUI_SWAP_TOOLS = new Set<string>([
  'spot_swap_base_for_quote', // base side is SUI for SUI_* pools
  'spot_swap_quote_for_base', // quote side is SUI for *_SUI pools
]);

async function submitSponsored(
  tx: Transaction,
  sender: string,
  client: ReturnType<typeof useSuiClient>,
  signTransaction: ReturnType<typeof useSignTransaction>['mutateAsync'],
): Promise<string> {
  const allowedMoveCallTargets = moveCallTargets(tx);
  const transactionKindBytes = toBase64(await tx.build({ client, onlyTransactionKind: true }));
  const created = await postJson('/api/sponsor/create', {
    sender,
    transactionKindBytes,
    allowedMoveCallTargets,
  });
  if (typeof created.bytes !== 'string' || typeof created.digest !== 'string') {
    throw new Error((created.message as string) ?? 'Couldn’t sponsor this transaction.');
  }
  const { signature } = await signTransaction({ transaction: Transaction.from(created.bytes) });
  const executed = await postJson('/api/sponsor/execute', { digest: created.digest, signature });
  if (typeof executed.digest !== 'string') {
    throw new Error((executed.message as string) ?? 'Sponsored execution failed.');
  }
  return executed.digest;
}

export function useSubmitTx() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { mutateAsync: signTransaction } = useSignTransaction();
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
      // Gasless via Enoki when enabled, EXCEPT SUI-swaps (architecturally unsponsorable — SUI input
      // would split from the sponsor's gas coin). Belt-and-suspenders: if a sponsorship attempt
      // throws (bad allowlist guess, future SDK change, transient Enoki 5xx), fall back to user-pays
      // so the trade still goes through instead of dead-ending. We only re-throw a wallet rejection
      // (the user declined) — that's not a failure to retry around.
      const useSponsorship = SPONSOR_ENABLED && !SUI_SWAP_TOOLS.has(toolName);
      let digest: string;
      if (useSponsorship) {
        try {
          digest = await submitSponsored(tx, owner, client, signTransaction);
        } catch (err) {
          if (isUserRejection(err)) throw err;
          clientLogger.warn('sponsor failed, falling back to user-pays', {
            tool: toolName,
            err: err instanceof Error ? err.message : String(err),
          });
          digest = (await signAndExecute({ transaction: tx })).digest;
        }
      } else {
        digest = (await signAndExecute({ transaction: tx })).digest;
      }

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
    [account, client, signAndExecute, signTransaction, qc],
  );
}
