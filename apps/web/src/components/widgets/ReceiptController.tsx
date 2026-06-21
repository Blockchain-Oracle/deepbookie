'use client';

import { useRef, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SignReceipt, type ReceiptLine } from './SignReceipt';
import { deriveReceiptState } from './receiptState';
import { useSubmitTx, reasonFor, isUserRejection } from '@/lib/hooks/useSubmitTx';
import { useQuote } from '@/lib/hooks/useQuote';
import { usePositions } from '@/lib/hooks/usePositions';
import { useBalanceManager } from '@/lib/hooks/useBalanceManager';
import { SUISCAN_TX } from '@/lib/constants';
import { docNumberFor, formatUsd, num, poolLabel, shortenDigest, str } from '@/lib/format';
import type { Direction } from '@/lib/bff/types';

export interface WriteToolPart {
  type: string;
  state?: string;
  input?: Record<string, unknown>;
  output?: {
    digest?: string;
    status?: string;
    amount?: number;
    takerFee?: number;
    makerFee?: number;
    stakeRequired?: number;
    proposalId?: string;
    newQuantity?: number;
    reducingBy?: number;
    base?: string;
  };
  toolCallId: string;
  errorText?: string;
}

/** Mirrors the AI SDK's discriminated tool-result contract (success xor error). */
export type AddToolResult = (
  a:
    | { tool: string; toolCallId: string; output: unknown }
    | { tool: string; toolCallId: string; state: 'output-error'; errorText: string },
) => void;

/** Reported the instant a write resolves — persisted independently of the transcript (the ledger). */
export interface SignOutcome {
  toolCallId: string;
  toolName: string;
  status: 'signed' | 'cancelled' | 'failed';
  digest?: string;
}
export type OnSignOutcome = (o: SignOutcome) => void;

export function ReceiptController({
  part,
  addToolResult,
  onRetry,
  onOutcome,
}: {
  part: WriteToolPart;
  addToolResult: AddToolResult;
  onRetry: () => void;
  onOutcome?: OnSignOutcome;
}) {
  const submit = useSubmitTx();
  const account = useCurrentAccount();
  const positionsQ = usePositions(account?.address);
  const bm = useBalanceManager(account?.address);
  const [local, setLocal] = useState<'idle' | 'signing' | 'dismissed'>('idle');
  // Synchronous re-entry guard — `local` state only flips next render, so a fast double-click could
  // pass a state-only check twice and queue two wallet prompts. A ref flips in the same tick.
  const inFlight = useRef(false);

  const toolName = part.type.slice('tool-'.length);
  const input = part.input ?? {};
  const isBet = toolName === 'mint' || toolName === 'redeem';
  const isSpot = toolName.startsWith('spot_');
  const needsManager = toolName !== 'create_manager' && !isSpot;
  const direction = (str(input.direction) || 'UP') as Direction;

  const quote = useQuote(
    isBet && input.oracleId
      ? { oracleId: str(input.oracleId), strikeUsd: num(input.strikeUsd), direction, quantityUsd: num(input.quantityUsd) }
      : undefined,
  );

  if (local === 'dismissed') return null;

  // Terminal part states win over the transient local 'signing' flag (shared with the spot cards).
  const state = deriveReceiptState(part, local === 'signing');

  const onAuthorize = async () => {
    if (inFlight.current) return; // synchronous re-entry / double-submit guard
    inFlight.current = true;
    setLocal('signing');
    try {
      const digest = await submit(toolName, input, {
        managerId: positionsQ.data?.managerId ?? undefined,
        balanceManagerId: bm.data?.balanceManagerId ?? undefined,
      });
      addToolResult({ tool: toolName, toolCallId: part.toolCallId, output: { digest } });
      onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'signed', digest });
    } catch (e) {
      // A wallet decline is a cancellation, not a failure — render the void receipt + log it as cancelled.
      if (isUserRejection(e)) {
        addToolResult({ tool: toolName, toolCallId: part.toolCallId, output: { status: 'cancelled' } });
        onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'cancelled' });
      } else {
        addToolResult({ tool: toolName, toolCallId: part.toolCallId, state: 'output-error', errorText: reasonFor(e) });
        onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'failed' });
      }
      setLocal('idle'); // allow retry after a failure
    } finally {
      inFlight.current = false; // clears on every terminal path so a legit retry isn't blocked
    }
  };

  const onCancel = () => {
    addToolResult({ tool: toolName, toolCallId: part.toolCallId, output: { status: 'cancelled' } });
    onOutcome?.({ toolCallId: part.toolCallId, toolName, status: 'cancelled' });
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
    // Spot (DeepBook V3) zero/fixed-input writes — the editable spot writes route to their own cards.
    spot_create_balance_manager: {
      title: 'Open your DeepBook account',
      lines: [{ label: 'Account', value: 'New BalanceManager' }],
    },
    spot_deposit: {
      title: `Deposit ${formatUsd(num(input.amount))} ${str(input.coinKey)}`,
      lines: [{ label: 'Coin', value: str(input.coinKey) }, { label: 'Amount', value: `${formatUsd(num(input.amount))} ${str(input.coinKey)}`, strong: true }],
    },
    spot_withdraw: {
      title: `Withdraw ${input.amount === undefined ? 'all' : formatUsd(num(input.amount))} ${str(input.coinKey)}`,
      lines: [{ label: 'Coin', value: str(input.coinKey) }, { label: 'Amount', value: input.amount === undefined ? 'All available' : `${formatUsd(num(input.amount))} ${str(input.coinKey)}`, strong: true }],
    },
    spot_place_market_order: {
      title: `${input.isBid ? 'Buy' : 'Sell'} ${formatUsd(num(input.quantity))} (market)`,
      lines: [{ label: 'Pool', value: poolLabel(str(input.poolKey)) }, { label: 'Quantity', value: formatUsd(num(input.quantity)), strong: true }],
    },
    spot_cancel_order: {
      title: 'Cancel order',
      lines: [{ label: 'Pool', value: poolLabel(str(input.poolKey)) }, { label: 'Order', value: shortenDigest(str(input.orderId)) }],
    },
    spot_cancel_all_orders: {
      title: 'Cancel all orders',
      lines: [{ label: 'Pool', value: poolLabel(str(input.poolKey)) }],
    },
  };
  const action = actions[toolName] ?? { title: toolName, lines: [] };
  return <SignReceipt {...common} title={action.title} lines={action.lines} />;
}
