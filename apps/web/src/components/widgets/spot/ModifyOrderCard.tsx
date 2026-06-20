'use client';

import { useMemo, useState } from 'react';
import { useSpotWriteCard } from '@/components/widgets/spot/useSpotWriteCard';
import type { AddToolResult, OnSignOutcome, WriteToolPart } from '@/components/widgets/ReceiptController';
import { SignReceipt, type ReceiptLine } from '@/components/widgets/SignReceipt';
import { SUISCAN_TX } from '@/lib/constants';
import { formatUsd } from '@/lib/format';

const TITLE = 'Reduce order';
const num = (v: unknown) => (typeof v === 'number' ? v : 0);
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** SUI_DBUSDC → { pair: "SUI/DBUSDC", base: "SUI", quote: "DBUSDC" }. */
function splitPool(poolKey: string): { pair: string; base: string; quote: string } {
  const [base = '', quote = ''] = poolKey.split('_');
  return { pair: base && quote ? `${base}/${quote}` : poolKey, base, quote };
}

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
  const { pair, base, quote } = splitPool(poolKey);
  const isBid = p.isBid === true;
  const price = num(p.price);
  const current = num(p.currentQuantity) || num(p.quantity);
  const filled = num(p.filledQuantity);
  // Seed at the agent's proposal if in range, else at the current size (a no-op until dragged down).
  const seeded = num(p.newQuantity);
  const seed = seeded > filled && seeded < current ? seeded : current;
  const [newQty, setNewQty] = useState<number>(seed);

  const reducingBy = Math.max(0, current - newQty);
  const releases = reducingBy * price;
  const invalid = newQty >= current || newQty <= filled || !poolKey || !orderId;
  const filledPct = current > 0 ? Math.min(100, (filled / current) * 100) : 0;
  const knobPct = current > 0 ? Math.min(100, (newQty / current) * 100) : 0;
  const activeWidth = Math.max(0, knobPct - filledPct);

  if (w.dismissed) return null;

  const docNumber = `DB·${part.toolCallId.slice(0, 4).toUpperCase()}·${part.toolCallId.slice(-4)}`;

  if (w.state !== 'proposed') {
    const lines: ReceiptLine[] = [
      { label: 'Pair', value: pair },
      { label: 'New quantity', value: `${qty(newQty)} ${base}`, strong: true, accent: true },
      { label: 'Reducing by', value: `−${qty(reducingBy)} ${base}` },
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

      {/* stepper */}
      <div className="mb-2 flex items-end justify-between">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">New quantity</span>
        <span className="font-mono text-[19px] font-semibold tabular-nums">{qty(newQty)}</span>
      </div>

      {/* slider — reduce only */}
      <div className="relative mb-[5px] h-6">
        <div className="absolute left-0 right-0 top-[9px] h-[5px] rounded-pill bg-[#EDE9E0]" />
        {/* hatched floor zone (cannot reduce below filled) */}
        <div
          className="absolute top-[9px] h-[5px] rounded-l-pill"
          style={{
            left: 0,
            width: `${filledPct}%`,
            background:
              'repeating-linear-gradient(45deg,#E6DCD4,#E6DCD4 3px,#EDE9E0 3px,#EDE9E0 6px)',
          }}
        />
        {/* active (selected) track */}
        <div
          className="absolute top-[9px] h-[5px] bg-ink"
          style={{ left: `${filledPct}%`, width: `${activeWidth}%` }}
        />
        <input
          type="range"
          min={filled}
          max={current}
          step={Math.max(0.1, current / 1000)}
          value={newQty}
          onChange={(e) => setNewQty(Number(e.target.value))}
          aria-label="New quantity"
          className="absolute inset-0 h-6 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-[17px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ink [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-[17px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(26,23,20,.18)]"
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

      {invalid && newQty >= current && (
        <div className="mb-[13px] flex items-center gap-2 rounded-[9px] border border-[#E6C9BE] bg-[#FBF1EC] px-3 py-[9px]">
          <span className="font-bold text-clay">!</span>
          <span className="text-[11.5px] text-[#8a2f1c]">
            New size must be below {qty(current)} — drag the slider down to reduce.
          </span>
        </div>
      )}

      {invalid && newQty <= filled && filled > 0 && (
        <div className="mb-[13px] flex items-center gap-2 rounded-[9px] border border-[#E6C9BE] bg-[#FBF1EC] px-3 py-[9px]">
          <span className="font-bold text-clay">!</span>
          <span className="text-[11.5px] text-[#8a2f1c]">
            New size must stay above the filled floor of {qty(filled)}.
          </span>
        </div>
      )}

      {!w.hasBalanceManager && !w.bmLoading && (
        <div className="mb-[13px] flex items-center gap-2 rounded-[9px] border border-[#E6C9BE] bg-[#FBF1EC] px-3 py-[9px]">
          <span className="font-bold text-clay">!</span>
          <span className="text-[11.5px] text-[#8a2f1c]">A balance manager is required to modify orders.</span>
        </div>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={!canSign}
          onClick={() => w.sign({ poolKey, orderId, newQuantity: newQty })}
          className={
            invalid
              ? 'flex-1 rounded-[9px] bg-[#EDE9E0] py-3 text-center text-sm font-semibold text-[#a8a298]'
              : 'flex-1 rounded-[9px] bg-ink py-3 text-center text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-50'
          }
        >
          {!invalid ? 'Update order' : newQty >= current ? 'No change to apply' : 'Reduce below filled'}
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
