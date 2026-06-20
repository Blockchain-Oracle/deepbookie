'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { SignReceipt, type ReceiptLine, type ReceiptState } from './SignReceipt';
import { useSubmitTx, reasonFor } from '@/lib/hooks/useSubmitTx';
import { useQuote } from '@/lib/hooks/useQuote';
import { usePositions } from '@/lib/hooks/usePositions';
import { SUISCAN_TX } from '@/lib/constants';
import { formatUsd, shortenDigest } from '@/lib/format';
import type { Direction } from '@/lib/bff/types';

export interface WriteToolPart {
  type: string;
  state?: string;
  input?: Record<string, unknown>;
  output?: { digest?: string; status?: string };
  toolCallId: string;
  errorText?: string;
}

/** Mirrors the AI SDK's discriminated tool-result contract (success xor error). */
export type AddToolResult = (
  a:
    | { tool: string; toolCallId: string; output: unknown }
    | { tool: string; toolCallId: string; state: 'output-error'; errorText: string },
) => void;

const num = (v: unknown) => (typeof v === 'number' ? v : 0);
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const docNumberFor = (id: string) => `DB·${id.slice(0, 4).toUpperCase()}·${id.slice(-4)}`;

export function ReceiptController({
  part,
  addToolResult,
  onRetry,
}: {
  part: WriteToolPart;
  addToolResult: AddToolResult;
  onRetry: () => void;
}) {
  const submit = useSubmitTx();
  const account = useCurrentAccount();
  const positionsQ = usePositions(account?.address);
  const [local, setLocal] = useState<'idle' | 'signing' | 'dismissed'>('idle');

  const toolName = part.type.slice('tool-'.length);
  const input = part.input ?? {};
  const isBet = toolName === 'mint' || toolName === 'redeem';
  const needsManager = toolName !== 'create_manager';
  const direction = (str(input.direction) || 'UP') as Direction;

  const quote = useQuote(
    isBet && input.oracleId
      ? { oracleId: str(input.oracleId), strikeUsd: num(input.strikeUsd), direction, quantityUsd: num(input.quantityUsd) }
      : undefined,
  );

  if (local === 'dismissed') return null;

  // Terminal part states (signed / cancelled / failed) win over transient local state, so a
  // reload/remount renders the right thing — cancellation is encoded in part.output, not local.
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

  const onAuthorize = async () => {
    if (local === 'signing') return; // re-entry / double-submit guard
    setLocal('signing');
    try {
      const digest = await submit(toolName, input, positionsQ.data?.managerId ?? undefined);
      addToolResult({ tool: toolName, toolCallId: part.toolCallId, output: { digest } });
    } catch (e) {
      addToolResult({ tool: toolName, toolCallId: part.toolCallId, state: 'output-error', errorText: reasonFor(e) });
      setLocal('idle'); // allow retry after a failure
    }
  };

  const onCancel = () => {
    addToolResult({ tool: toolName, toolCallId: part.toolCallId, output: { status: 'cancelled' } });
  };

  const common = {
    state,
    docNumber: docNumberFor(part.toolCallId),
    digest: part.output?.digest,
    suiscanUrl: part.output?.digest ? SUISCAN_TX(part.output.digest) : undefined,
    reason: part.errorText,
    authorizeDisabled: needsManager && !!account && positionsQ.isLoading,
    onAuthorize,
    onCancel,
    onRetry,
    onDismiss: () => setLocal('dismissed'),
  };

  if (isBet) {
    const strike = num(input.strikeUsd);
    const qty = num(input.quantityUsd);
    const title = `${direction === 'UP' ? 'Above' : 'Below'} $${formatUsd(strike, 0)}`;
    const lines: ReceiptLine[] =
      toolName === 'redeem'
        ? [
            { label: 'Quantity', value: `${formatUsd(qty)} contracts` },
            { label: 'Redeem value', value: `${formatUsd(quote.data?.redeemPayoutUsd ?? 0)} dUSDC`, strong: true, accent: true },
          ]
        : [
            { label: 'Quantity', value: `${formatUsd(qty)} contracts` },
            { label: 'Cost + fee', value: quote.data ? `${formatUsd(quote.data.mintCostUsd)} dUSDC` : 'computing…' },
            { label: 'Max payout if right', value: `${formatUsd(qty)} dUSDC`, strong: true, accent: true },
          ];
    return <SignReceipt {...common} title={title} direction={direction} settleNote="Binary · settles at expiry" lines={lines} />;
  }

  const actions: Record<string, { title: string; lines: ReceiptLine[] }> = {
    create_manager: { title: 'Open your trading account', lines: [{ label: 'Account', value: 'New PredictManager' }] },
    supply: { title: 'Provide vault liquidity', lines: [{ label: 'Amount', value: `${formatUsd(num(input.amountUsd))} dUSDC` }] },
    withdraw: { title: 'Withdraw vault liquidity', lines: [{ label: 'PLP coin', value: shortenDigest(str(input.plpCoinId)) }] },
    mint_range: {
      title: `In $${formatUsd(num(input.lowerStrikeUsd), 0)}–$${formatUsd(num(input.higherStrikeUsd), 0)}`,
      lines: [{ label: 'Quantity', value: `${formatUsd(num(input.quantityUsd))} contracts`, strong: true }],
    },
    redeem_range: {
      title: `Settle $${formatUsd(num(input.lowerStrikeUsd), 0)}–$${formatUsd(num(input.higherStrikeUsd), 0)}`,
      lines: [{ label: 'Quantity', value: `${formatUsd(num(input.quantityUsd))} contracts`, strong: true }],
    },
  };
  const action = actions[toolName] ?? { title: toolName, lines: [] };
  return <SignReceipt {...common} title={action.title} lines={action.lines} />;
}
