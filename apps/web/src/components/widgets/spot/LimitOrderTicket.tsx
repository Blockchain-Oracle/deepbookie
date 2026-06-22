'use client';

import { useMemo, useState } from 'react';
import { useSpotWriteCard } from '@/components/widgets/spot/useSpotWriteCard';
import { NoBalanceManagerNotice } from '@/components/widgets/spot/NoBalanceManagerNotice';
import { OrderValidityHint } from '@/components/widgets/spot/OrderValidityHint';
import { useSpotPoolParams, useSpotCanPlaceLimit } from '@/lib/hooks/useSpotRead';
import type { AddToolResult, OnSignOutcome, WriteToolPart } from '@/components/widgets/ReceiptController';
import { SignReceipt, type ReceiptLine } from '@/components/widgets/SignReceipt';
import { SUISCAN_TX } from '@/lib/constants';
import { docNumberFor, formatUsd, poolLabel, splitPool, str } from '@/lib/format';
import { DEFAULT_SPOT_POOL } from '@/lib/spot/constants';

const fmt = (n: number, dp: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const dpOf = (step: number) => (step > 0 && step < 1 ? Math.min(8, Math.round(-Math.log10(step))) : step >= 1 ? 1 : 4);
const isMult = (v: number, step: number) => (step > 0 ? Math.abs(v / step - Math.round(v / step)) < 1e-6 : true);

interface FieldErr {
  /** Right-aligned tag inside the field, e.g. "off tick". */
  tag: string;
  /** Sentence rendered under the field. */
  sentence: string;
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
  err?: FieldErr;
}) {
  const bad = !!props.err;
  return (
    <div className="mb-1.5">
      <div
        className={`rounded-[9px] border px-[13px] py-[9px] ${bad ? 'border-[#E6C9BE] bg-[#FBF1EC]' : 'border-line bg-[#FBFAF7]'}`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[9.5px] font-semibold uppercase tracking-[0.13em] ${bad ? 'text-clay' : 'text-faint'}`}>
            {props.label}
          </span>
          <span className={`font-mono text-[10px] ${bad ? 'text-clay' : 'text-[#a8a298]'}`}>{bad ? props.err!.tag : props.hint}</span>
        </div>
        <input
          inputMode="decimal"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          className={`mt-[3px] w-full bg-transparent font-mono text-[17px] font-semibold tabular-nums outline-none ${bad ? 'text-clay' : 'text-ink'}`}
        />
      </div>
      {bad && <div className="mx-0.5 mt-1 text-[11px] text-[#8a2f1c]">{props.err!.sentence}</div>}
    </div>
  );
}

export function LimitOrderTicket({
  part,
  addToolResult,
  onOutcome,
  onRetry,
}: {
  part: WriteToolPart;
  addToolResult: AddToolResult;
  onOutcome?: OnSignOutcome;
  onRetry: () => void;
}) {
  const w = useSpotWriteCard(part, addToolResult, onOutcome);
  const proposed = w.proposed;

  const poolKey = str(proposed.poolKey) || DEFAULT_SPOT_POOL;
  const params = useSpotPoolParams(poolKey);
  const p = params.data;

  const [isBid, setIsBid] = useState<boolean>(proposed.isBid !== false);
  const [price, setPrice] = useState<string>(proposed.price != null ? String(proposed.price) : '');
  const [qty, setQty] = useState<string>(proposed.quantity != null ? String(proposed.quantity) : '');

  const priceN = Number(price);
  const qtyN = Number(qty);
  const payWithDeep = p ? !p.whitelisted : true;

  const priceDp = dpOf(p?.tickSize ?? 0.0001);
  const qtyDp = dpOf(p?.lotSize ?? 0.1);
  const { base, quote } = splitPool(poolKey);

  const priceErr: FieldErr | undefined =
    price && p && priceN > 0 && !isMult(priceN, p.tickSize)
      ? { tag: 'off tick', sentence: `Price must be a multiple of the ${fmt(p.tickSize, priceDp)} tick.` }
      : undefined;
  const qtyErr: FieldErr | undefined =
    qty && p && qtyN > 0 && qtyN < p.minSize
      ? { tag: 'below min', sentence: `Minimum order size is ${fmt(p.minSize, qtyDp)} ${base}.` }
      : undefined;

  const notional = priceN > 0 && qtyN > 0 ? priceN * qtyN : 0;
  const makerFee = notional > 0 && p ? notional * p.makerFee : 0;

  const inputsClean = priceN > 0 && qtyN > 0 && !priceErr && !qtyErr;
  // Only run the pre-flight while the ticket is editable — no point checking in terminal receipt states.
  const can = useSpotCanPlaceLimit(
    w.state === 'proposed' && inputsClean ? { poolKey, price: priceN, quantity: qtyN, isBid, payWithDeep } : undefined,
  );
  const validating = can.isLoading || params.isLoading;
  const canPlace = can.data?.canPlace ?? false;

  const docNumber = docNumberFor(part.toolCallId);
  const title = `${isBid ? 'Buy' : 'Sell'} ${fmt(qtyN || 0, qtyDp)} ${base} @ ${fmt(priceN || 0, priceDp)}`;
  const lines: ReceiptLine[] = useMemo(
    () => [
      { label: 'Notional', value: `${formatUsd(notional)} ${quote}` },
      { label: 'Est. maker fee', value: makerFee > 0 ? makerFee.toFixed(2) : '0.00' },
    ],
    [notional, quote, makerFee],
  );

  if (w.dismissed) return null;

  if (w.state !== 'proposed') {
    return (
      <SignReceipt
        state={w.state}
        title={title}
        lines={lines}
        docNumber={docNumber}
        digest={w.digest}
        suiscanUrl={w.digest ? SUISCAN_TX(w.digest) : undefined}
        reason={w.reason}
        onRetry={onRetry}
        onDismiss={w.dismiss}
      />
    );
  }

  // `can.isError` too: TanStack retains the last good pre-flight (possibly canPlace:true) on a
  // background-refetch error, so without this a stale "valid" could re-enable the CTA. Mirrors SwapCard.
  const blocked = !inputsClean || !canPlace || validating || !w.hasBalanceManager || can.isError;
  const ctaLabel = !w.hasBalanceManager
    ? 'Open a BalanceManager first'
    : !inputsClean || !canPlace
      ? 'Fix order to continue'
      : `Place ${isBid ? 'buy' : 'sell'} order`;
  const ctaTone = blocked
    ? 'bg-[#EDE9E0] text-[#a8a298]'
    : isBid
      ? 'bg-green text-white hover:opacity-90'
      : 'bg-clay text-white hover:opacity-90';

  const onPlace = () => {
    if (blocked) return;
    void w.sign({ poolKey, price: priceN, quantity: qtyN, isBid, payWithDeep });
  };

  return (
    <div className="rounded-card border border-line bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Limit order · {poolLabel(poolKey)}</span>
        <span className="font-mono text-[10px] text-faint">{docNumber}</span>
      </div>

      <div className="mb-[13px] flex gap-1.5 rounded-[9px] bg-[#F6F4EF] p-[3px]">
        {([true, false] as const).map((bid) => {
          const active = isBid === bid;
          const tone = active ? (bid ? 'bg-green text-white' : 'bg-clay text-white') : 'text-[#7d7870]';
          return (
            <button
              key={String(bid)}
              type="button"
              onClick={() => setIsBid(bid)}
              className={`flex-1 rounded-[7px] py-2 text-center text-[13px] transition ${active ? 'font-bold' : 'font-semibold'} ${tone}`}
            >
              {bid ? 'Buy' : 'Sell'}
            </button>
          );
        })}
      </div>

      <Field
        label={`Price · ${quote}`}
        value={price}
        onChange={setPrice}
        hint={`tick ${p ? fmt(p.tickSize, priceDp) : '—'}`}
        err={priceErr}
      />
      <Field
        label={`Quantity · ${base}`}
        value={qty}
        onChange={setQty}
        hint={p ? `lot ${fmt(p.lotSize, qtyDp)} · min ${fmt(p.minSize, qtyDp)}` : 'lot — · min —'}
        err={qtyErr}
      />

      <div className="mb-[3px] mt-2.5 flex justify-between py-[5px] text-[13px]">
        <span className="text-[#7d7870]">Notional</span>
        <span className="font-mono font-semibold tabular-nums">{formatUsd(notional)} {quote}</span>
      </div>
      <div className="mb-2 flex justify-between py-[5px] text-[13px]">
        <span className="text-[#7d7870]">Est. maker fee</span>
        <span className="font-mono font-medium tabular-nums">{makerFee > 0 ? makerFee.toFixed(2) : '—'}</span>
      </div>

      {inputsClean && !validating &&
        (can.isError ? (
          // The pre-flight read failed (network) — don't assert a false "insufficient balance" reason.
          <div className="mb-[11px] rounded-[8px] border border-line bg-[#FBFAF7] px-3 py-2 text-[11.5px] font-medium text-muted">
            Couldn’t pre-check this order right now — try again in a moment.
          </div>
        ) : (
          <OrderValidityHint valid={canPlace} className="mb-[11px]" />
        ))}
      {!w.hasBalanceManager && !w.bmLoading && (
        <NoBalanceManagerNotice w={w} action="place maker orders" variant="inline" onRetry={w.bmRefetch} onDismiss={w.cancel} />
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onPlace}
          disabled={blocked}
          className={`flex-1 rounded-[9px] py-3 text-center text-sm font-semibold transition ${ctaTone}`}
        >
          {ctaLabel}
        </button>
        <button
          type="button"
          onClick={w.cancel}
          className="rounded-[9px] border border-line-strong px-5 py-3 text-sm font-semibold text-[#7d7870] transition hover:bg-paper"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
