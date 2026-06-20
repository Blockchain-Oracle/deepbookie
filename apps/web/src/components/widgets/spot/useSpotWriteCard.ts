'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useBalanceManager } from '@/lib/hooks/useBalanceManager';
import { isUserRejection, reasonFor, useSubmitTx } from '@/lib/hooks/useSubmitTx';
import type { AddToolResult, OnSignOutcome, WriteToolPart } from '@/components/widgets/ReceiptController';
import type { ReceiptState } from '@/components/widgets/SignReceipt';

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

  const cancelled = part.state === 'output-available' && part.output?.status === 'cancelled';
  const state: ReceiptState = cancelled
    ? 'cancelled'
    : part.state === 'output-available'
      ? 'signed'
      : part.state === 'output-error'
        ? 'failed'
        : local === 'signing'
          ? 'signing'
          : part.state === 'input-streaming'
            ? 'loading'
            : 'proposed';

  const toolName = part.type.slice('tool-'.length);
  const balanceManagerId = bm.data?.balanceManagerId ?? null;

  async function sign(input: Record<string, unknown>) {
    if (local === 'signing') return;
    setLocal('signing');
    try {
      const digest = await submit(toolName, input, { balanceManagerId: balanceManagerId ?? undefined });
      addToolResult({ tool: toolName, toolCallId: part.toolCallId, output: { digest } });
      onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'signed', digest });
    } catch (e) {
      // A wallet decline is a cancellation, not a failure (render the void receipt + log it).
      if (isUserRejection(e)) {
        addToolResult({ tool: toolName, toolCallId: part.toolCallId, output: { status: 'cancelled' } });
        onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'cancelled' });
      } else {
        addToolResult({ tool: toolName, toolCallId: part.toolCallId, state: 'output-error', errorText: reasonFor(e) });
        onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'failed' });
      }
      setLocal('idle'); // allow retry after a failure
    }
  }

  function cancel() {
    addToolResult({ tool: toolName, toolCallId: part.toolCallId, output: { status: 'cancelled' } });
    onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'cancelled' });
  }

  return {
    state,
    toolName,
    /** The wallet's resolved BalanceManager id (null if none yet). Swaps don't need it; orders do. */
    balanceManagerId,
    hasBalanceManager: !!balanceManagerId,
    bmLoading: bm.isLoading,
    /** Agent-proposed args — seed the form's defaults from these. */
    proposed: part.input ?? {},
    digest: part.output?.digest,
    reason: part.errorText,
    dismissed: local === 'dismissed',
    sign,
    cancel,
    dismiss: () => setLocal('dismissed'),
  };
}
