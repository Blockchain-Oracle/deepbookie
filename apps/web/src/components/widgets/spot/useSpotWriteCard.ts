'use client';

import { useRef, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useBalanceManager } from '@/lib/hooks/useBalanceManager';
import { useSubmitTx } from '@/lib/hooks/useSubmitTx';
import { diagnose, isUserRejection, type Diagnosis } from '@/lib/diagnose';
import { deriveReceiptState } from '@/components/widgets/receiptState';
import type { AddToolResult, OnSignOutcome, WriteToolPart } from '@/components/widgets/ReceiptController';

/**
 * The shared lifecycle for a generative-input spot write card. The user edits values in the card,
 * then `sign(tool, builtInput)` runs the SAME keyless handshake the Predict ReceiptController uses:
 * build the unsigned tx client-side (BalanceManager id threaded in), sign in the wallet, complete the
 * tool call via `addToolResult` (so the AI stream resumes), and report the outcome to the ledger.
 *
 * Widgets render their FORM while `state === 'proposed'`, and a terminal <SignReceipt> otherwise.
 * Cancellation is encoded in `part.output.status` so a reload renders the right thing.
 */
export function useSpotWriteCard(part: WriteToolPart, addToolResult: AddToolResult, onOutcome?: OnSignOutcome) {
  const submit = useSubmitTx();
  const account = useCurrentAccount();
  const bm = useBalanceManager(account?.address);
  const [local, setLocal] = useState<'idle' | 'signing' | 'dismissed'>('idle');
  const [localDiagnosis, setLocalDiagnosis] = useState<Diagnosis | undefined>();
  // Synchronous re-entry guard. `local` is React state — `setLocal('signing')` only flips on the next
  // render, so a fast double-click (or Enter+click) before that commit would pass a state-only check
  // twice and pop the wallet twice → two signed txs. A ref flips in the same tick. (Mirrors useTxAction.)
  const inFlight = useRef(false);

  const state = deriveReceiptState(part, local === 'signing');

  const toolName = part.type.slice('tool-'.length);
  const balanceManagerId = bm.data?.balanceManagerId ?? null;

  // `output` lets a card persist EDITED figures (e.g. the staked amount) into the durable tool
  // output, so the terminal receipt — and a History replay after remount — shows what was signed,
  // not the agent's original proposal or an ephemeral 0.
  async function sign(input: Record<string, unknown>, output?: Record<string, unknown>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setLocal('signing');
    try {
      const digest = await submit(toolName, input, { balanceManagerId: balanceManagerId ?? undefined });
      addToolResult({ tool: toolName, toolCallId: part.toolCallId, output: { digest, ...output } });
      onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'signed', digest });
    } catch (e) {
      // A wallet decline is a cancellation, not a failure (render the void receipt + log it).
      if (isUserRejection(e)) {
        addToolResult({ tool: toolName, toolCallId: part.toolCallId, output: { status: 'cancelled' } });
        onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'cancelled' });
      } else {
        const d = diagnose(e);
        setLocalDiagnosis(d);
        addToolResult({ tool: toolName, toolCallId: part.toolCallId, state: 'output-error', errorText: d.forModel });
        onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'failed' });
      }
      setLocal('idle'); // allow retry after a failure
    } finally {
      inFlight.current = false; // clears on every terminal path so a legit retry isn't blocked
    }
  }

  function cancel() {
    if (inFlight.current) return; // drop a double-tap (or a cancel mid-sign) — one terminal resolution only
    inFlight.current = true;
    addToolResult({ tool: toolName, toolCallId: part.toolCallId, output: { status: 'cancelled' } });
    onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'cancelled' });
  }

  return {
    state,
    toolName,
    /** The wallet's resolved BalanceManager id (null if none yet). Swaps don't need it; orders do. */
    balanceManagerId,
    hasBalanceManager: !!balanceManagerId,
    /** Wallet connected? When false the BM query is disabled (so bmLoading is false too) — cards should
     *  prompt "connect", NOT "create an account" (which would be misleading for a disconnected user). */
    connected: !!account,
    bmLoading: bm.isLoading,
    /** Resolver-error flag — true when the BM lookup FAILED (vs genuinely none). Cards show retry,
     *  not "create one", so a transient failure can't lead to a duplicate shared BalanceManager. */
    bmError: (bm.data?.error ?? false) || bm.isError,
    /** localStorage blocked → BM existence is UNKNOWN (resolver can't find shared BMs). Warn, don't
     *  imply "no account" — a returning user could otherwise be nudged into a duplicate. */
    storageBlocked: bm.data?.storageBlocked ?? false,
    bmRefetch: () => void bm.refetch(),
    /** Agent-proposed args — seed the form's defaults from these. NOTE: cards seed editable fields via
     *  one-shot lazy `useState` initializers and are keyed stably (never remount to re-seed), so this
     *  MUST be the FINAL streamed input. That's guaranteed by MessagePart rendering a skeleton while
     *  `state === 'input-streaming'` and only mounting the card afterward — don't break that gate or
     *  every seed silently captures empty proposal values. */
    proposed: part.input ?? {},
    digest: part.output?.digest,
    reason: part.errorText,
    diagnosis: localDiagnosis,
    dismissed: local === 'dismissed',
    sign,
    cancel,
    dismiss: () => setLocal('dismissed'),
  };
}
