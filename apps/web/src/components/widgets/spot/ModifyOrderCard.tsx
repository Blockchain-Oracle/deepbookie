'use client';

import { useState } from 'react';
import { useSpotWriteCard } from '@/components/widgets/spot/useSpotWriteCard';
import { NoBalanceManagerNotice } from '@/components/widgets/spot/NoBalanceManagerNotice';
import { CardNotice } from '@/components/widgets/spot/CardNotice';
import { useSpotOpenOrders, useSpotPoolParams } from '@/lib/hooks/useSpotRead';
import type { AddToolResult, OnSignOutcome, WriteToolPart } from '@/components/widgets/ReceiptController';
import { SignReceipt, type ReceiptLine } from '@/components/widgets/SignReceipt';
import { SUISCAN_TX } from '@/lib/constants';
import { docNumberFor, formatUsd, num, splitPool, str } from '@/lib/format';

const TITLE = 'Reduce order';
const qty = (n: number) => formatUsd(n, 1);

export function ModifyOrderCard({
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
  const p = w.proposed;

  const poolKey = str(p.poolKey);
  const orderId = str(p.orderId);
  const { base, quote, pair } = splitPool(poolKey);

  // Reduce-only bounds come from the LIVE order — NEVER agent input (spot_modify_order's schema only
  // carries {poolKey, orderId, newQuantity}, so current/filled/price/isBid are stripped before us).
  const orders = useSpotOpenOrders(w.state === 'proposed' && w.hasBalanceManager && poolKey ? poolKey : undefined);
  const order = orders.data?.find((o) => o.orderId === orderId);
  // All bounds come from the LIVE order; spot_modify_order's schema carries only {poolKey, orderId,
  // newQuantity}, so there is no agent-supplied isBid/price to fall back to. The header that uses these
  // only renders after the `!order`/loading guards below, so order is defined by then.
  const isBid = order?.isBid ?? false;
  const price = order?.price ?? 0;
  const current = order?.quantity ?? 0;
  const filled = order?.filledQuantity ?? 0;

  // Lot/min from pool params — the on-chain modify asserts newQuantity % lotSize == 0 AND
  // newQuantity >= minSize AND newQuantity < current. We FLOOR to the lot grid (never round up), so the
  // signed value is always a lot multiple ≤ the slider value, hence strictly below current when valid.
  const params = useSpotPoolParams(w.state === 'proposed' && poolKey ? poolKey : undefined);
  const lotSize = params.data?.lotSize ?? 0;
  const minSize = params.data?.minSize ?? 0;
  const paramsReady = !!params.data;
  // +epsilon before flooring so an on-grid slider value (e.g. 2.3/0.1 = 22.9999…) doesn't drop a whole
  // lot; round the product back to clean decimals to avoid float dust (2.2000000000000002).
  const snap = (v: number) => (lotSize > 0 ? Math.round(Math.floor(v / lotSize + 1e-9) * lotSize * 1e9) / 1e9 : v);

  // The user drags the lot-aligned slider down to reduce. Seed at the agent's proposal whenever it's a
  // genuine reduce (0 < seeded < current) — EVEN if below the filled floor or min size — so the specific
  // reason banner (below filled / below min) explains why it's rejected, instead of falling back to
  // `current` and showing a generic "No change to apply". A non-reduce proposal → current (no-op).
  const seeded = num(p.newQuantity);
  const defaultQty = seeded > 0 && seeded < current ? seeded : current;
  const [override, setOverride] = useState<number | null>(null);
  const newQty = override ?? defaultQty;
  const signQty = snap(newQty); // the lot-aligned value we validate AND sign

  // Snapshot the signed figures so the terminal receipt stays correct after the order leaves the book.
  const [signed, setSigned] = useState<{ newQty: number; reducingBy: number; base: string } | null>(null);

  const reducingBy = Math.max(0, current - signQty);
  const releases = reducingBy * price;
  const belowMin = minSize > 0 && signQty < minSize;
  // Gate on the SAME bounds we sign: newQty>=current is "no change"; signQty<=filled / belowMin invalid.
  // lotSize<=0 means snap() can't lot-align (would sign a raw qty that aborts on-chain) → never sign.
  const invalid = !order || newQty >= current || signQty <= filled || belowMin || !paramsReady || lotSize <= 0;
  const filledPct = current > 0 ? Math.min(100, (filled / current) * 100) : 0;
  // Track from signQty (the lot-aligned, to-be-signed value) so the ink bar matches the numeric readout.
  const knobPct = current > 0 ? Math.min(100, (signQty / current) * 100) : 0;
  const activeWidth = Math.max(0, knobPct - filledPct);

  if (w.dismissed) return null;

  const docNumber = docNumberFor(part.toolCallId);

  if (w.state !== 'proposed') {
    // Prefer the in-session snapshot; on a remount/History replay (snapshot gone, live order gone) read
    // the figures persisted to the durable tool output so the receipt doesn't render "0".
    const s = signed ?? {
      newQty: num(part.output?.newQuantity) || signQty,
      reducingBy: num(part.output?.reducingBy) || reducingBy,
      base: str(part.output?.base) || base,
    };
    const lines: ReceiptLine[] = [
      { label: 'Pair', value: pair },
      { label: 'New quantity', value: `${qty(s.newQty)} ${s.base}`, strong: true, accent: true },
      { label: 'Reducing by', value: `−${qty(s.reducingBy)} ${s.base}` },
    ];
    return (
      <SignReceipt
        state={w.state}
        title={TITLE}
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

  // A BalanceManager is required to read/modify orders. The shared notice resolves the tool call via
  // Dismiss (so the assistant turn never wedges) and offers Retry only on a resolver failure.
  if (!w.hasBalanceManager && !w.bmLoading) {
    return <NoBalanceManagerNotice w={w} title={TITLE} action="modify orders" variant="card" onRetry={w.bmRefetch} onDismiss={w.cancel} />;
  }

  // Resolving the live order / pool limits — hold space rather than render a dead slider.
  if (orders.isLoading || w.bmLoading) {
    return (
      <div className="flex h-[150px] w-full items-center justify-center rounded-card border border-line bg-card">
        <span className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-ink" />
      </div>
    );
  }

  // A transient read failure must NOT masquerade as "order gone" (the user could re-place a duplicate).
  if (orders.isError) {
    return <CardNotice title={TITLE} text="Couldn’t load this order right now — try again in a moment." onDismiss={w.cancel} onRetry={() => void orders.refetch()} />;
  }

  // The order isn't in the book anymore (filled, cancelled, or expired) — nothing valid to sign.
  if (!order) {
    return (
      <CardNotice
        title={TITLE}
        text={`That order is no longer open on ${pair} — it may have filled or been cancelled.`}
        onDismiss={w.cancel}
      />
    );
  }

  const canSign = !invalid && w.hasBalanceManager && !w.bmLoading;

  return (
    <div className="rounded-card border border-line bg-card px-4 py-[15px]">
      {/* header */}
      <div className="mb-[13px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DirBadge isBid={isBid} />
          <span className="text-[13.5px] font-bold">{pair}</span>
        </div>
        <span className="font-mono text-xs tabular-nums text-[#7d7870]">@ {formatUsd(price, 4)}</span>
      </div>

      {/* current fill */}
      <div className="mb-[14px] rounded-[9px] border border-[#EDE9E0] bg-[#FBFAF7] px-3 py-2.5">
        <div className="mb-[7px] flex justify-between">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">Current order</span>
          <span className="font-mono text-[11px] tabular-nums text-[#7d7870]">
            {qty(filled)} / {qty(current)} filled
          </span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-pill bg-[#EDE9E0]">
          <div className="h-full bg-green" style={{ width: `${filledPct}%` }} />
        </div>
      </div>

      {/* stepper — show the lot-aligned value that will actually be signed */}
      <div className="mb-2 flex items-end justify-between">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">New quantity</span>
        <span className="font-mono text-[19px] font-semibold tabular-nums">{qty(signQty)}</span>
      </div>

      {/* slider — reduce only, lot-aligned (min=0 so the step grid lands on lot multiples) */}
      <div className="relative mb-[5px] h-6">
        <div className="absolute left-0 right-0 top-[9px] h-[5px] rounded-pill bg-[#EDE9E0]" />
        {/* hatched floor zone (cannot reduce below filled) */}
        <div
          className="absolute top-[9px] h-[5px] rounded-l-pill"
          style={{
            left: 0,
            width: `${filledPct}%`,
            background: 'repeating-linear-gradient(45deg,#E6DCD4,#E6DCD4 3px,#EDE9E0 3px,#EDE9E0 6px)',
          }}
        />
        {/* active (selected) track */}
        <div className="absolute top-[9px] h-[5px] bg-ink" style={{ left: `${filledPct}%`, width: `${activeWidth}%` }} />
        <input
          type="range"
          min={0}
          max={current}
          step={lotSize > 0 ? lotSize : Math.max(0.1, current / 1000)}
          value={newQty}
          disabled={!paramsReady}
          onChange={(e) => setOverride(Number(e.target.value))}
          aria-label="New quantity"
          className="absolute inset-0 h-6 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed [&::-moz-range-thumb]:size-[17px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ink [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-[17px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(26,23,20,.18)]"
        />
      </div>
      <div className="mb-[13px] flex justify-between font-mono text-[9.5px] text-[#b0aa9f]">
        <span>{qty(filled)} (filled floor)</span>
        <span>{qty(current)} (current · max)</span>
      </div>

      {/* outcome rows */}
      <div className="flex justify-between py-1 text-[13px]">
        <span className="text-[#7d7870]">Reducing by</span>
        <span className="font-mono font-semibold tabular-nums text-clay">−{qty(reducingBy)} {base}</span>
      </div>
      <div className="mb-[7px] flex justify-between py-1 text-[13px]">
        <span className="text-[#7d7870]">Releases notional</span>
        <span className="font-mono font-medium tabular-nums">
          {formatUsd(releases)} {quote}
        </span>
      </div>

      <div className="mb-[13px] rounded-[7px] bg-[#F6F4EF] px-2.5 py-[7px] text-[10.5px] leading-[1.4] text-faint">
        ↑ To <b className="text-[#7d7870]">increase</b> size, cancel &amp; re-place — modify can only reduce.
      </div>

      {invalid && newQty >= current && paramsReady && (
        <div className="mb-[13px] flex items-center gap-2 rounded-[9px] border border-[#E6C9BE] bg-[#FBF1EC] px-3 py-[9px]">
          <span className="font-bold text-clay">!</span>
          <span className="text-[11.5px] text-[#8a2f1c]">
            New size must be below {qty(current)} — drag the slider down to reduce.
          </span>
        </div>
      )}

      {invalid && signQty <= filled && filled > 0 && newQty < current && (
        <div className="mb-[13px] flex items-center gap-2 rounded-[9px] border border-[#E6C9BE] bg-[#FBF1EC] px-3 py-[9px]">
          <span className="font-bold text-clay">!</span>
          <span className="text-[11.5px] text-[#8a2f1c]">
            New size must stay above the filled floor of {qty(filled)}.
          </span>
        </div>
      )}

      {belowMin && newQty < current && signQty > filled && (
        <div className="mb-[13px] flex items-center gap-2 rounded-[9px] border border-[#E6C9BE] bg-[#FBF1EC] px-3 py-[9px]">
          <span className="font-bold text-clay">!</span>
          <span className="text-[11.5px] text-[#8a2f1c]">
            New size is below the {qty(minSize)} minimum — cancel the order instead to go lower.
          </span>
        </div>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={!canSign}
          onClick={() => {
            setSigned({ newQty: signQty, reducingBy, base });
            // Persist the figures so the receipt survives a remount / History replay (live order is gone).
            void w.sign({ poolKey, orderId, newQuantity: signQty }, { newQuantity: signQty, reducingBy, base });
          }}
          className={
            invalid
              ? 'flex-1 rounded-[9px] bg-[#EDE9E0] py-3 text-center text-sm font-semibold text-[#a8a298]'
              : 'flex-1 rounded-[9px] bg-ink py-3 text-center text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-50'
          }
        >
          {!paramsReady
            ? 'Loading limits…'
            : !invalid
              ? 'Update order'
              : newQty >= current
                ? 'No change to apply'
                : belowMin
                  ? 'Below minimum size'
                  : 'Reduce below filled'}
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

function DirBadge({ isBid }: { isBid: boolean }) {
  return isBid ? (
    <span className="rounded-[4px] border-[1.2px] border-green px-[7px] py-px text-[10px] font-bold text-green">BUY</span>
  ) : (
    <span className="rounded-[4px] border-[1.2px] border-clay px-[7px] py-px text-[10px] font-bold text-clay">SELL</span>
  );
}
