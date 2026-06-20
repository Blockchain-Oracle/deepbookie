'use client';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import type { SpotLevel, SpotOrderbook } from '@/lib/bff/spot-types';

const PRICE_DP = 4;
const ASK_BAR = '#F6E4DE';
const BID_BAR = '#E3EDE6';
const SIZE_INK = '#a8a298';

/** Sensible size precision: whole numbers for >=100, else up to 2dp. */
function fmtSize(n: number): string {
  const dp = n >= 100 ? 0 : n >= 1 ? 1 : 2;
  return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/** Cumulative depth from the mid outward, normalized to a shared max so the two sides are comparable. */
function cumulative(levels: SpotLevel[], maxOverride?: number): { level: SpotLevel; depth: number }[] {
  let run = 0;
  const rows = levels.map((level) => {
    run += level.size;
    return { level, depth: run };
  });
  const max = (maxOverride ?? run) || 1;
  return rows.map((r) => ({ level: r.level, depth: r.depth / max }));
}

const totalSize = (levels: SpotLevel[]) => levels.reduce((s, l) => s + l.size, 0);

function AskRow({ level, depth }: { level: SpotLevel; depth: number }) {
  return (
    <div className="relative flex h-[18px] items-center justify-end">
      <div
        className="absolute bottom-0 left-0 top-0 rounded-[3px]"
        style={{ right: `${(1 - depth) * 100}%`, background: ASK_BAR }}
      />
      <span
        className="absolute left-2 font-mono tabular-nums text-[10.5px]"
        style={{ color: SIZE_INK }}
      >
        {fmtSize(level.size)}
      </span>
      <span className="relative font-mono tabular-nums text-[11px] font-semibold text-[#B0452B]">
        {level.price.toFixed(PRICE_DP)}
      </span>
    </div>
  );
}

function BidRow({ level, depth }: { level: SpotLevel; depth: number }) {
  return (
    <div className="relative flex h-[18px] items-center justify-start">
      <div
        className="absolute bottom-0 right-0 top-0 rounded-[3px]"
        style={{ left: `${(1 - depth) * 100}%`, background: BID_BAR }}
      />
      <span className="relative font-mono tabular-nums text-[11px] font-semibold text-[#2C5E4A]">
        {level.price.toFixed(PRICE_DP)}
      </span>
      <span
        className="absolute right-2 font-mono tabular-nums text-[10.5px]"
        style={{ color: SIZE_INK }}
      >
        {fmtSize(level.size)}
      </span>
    </div>
  );
}

function Header({ poolKey, ticks }: { poolKey: string; ticks: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="text-[13.5px] font-bold text-ink">{poolKey.replace(/_/g, '/')}</span>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2C5E4A]" />
        <span className="font-mono text-[10.5px] font-medium text-[#2C5E4A]">
          L2 · {ticks} {ticks === 1 ? 'tick' : 'ticks'}
        </span>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-[11px] flex justify-between border-t border-[#EDE9E0] pt-[7px] font-mono text-[9px] text-[#b0aa9f]">
      <span>size</span>
      <span>price</span>
      <span>size</span>
    </div>
  );
}

function LoadingState() {
  return (
    <Card className="w-full max-w-[380px] px-4 pb-[13px] pt-[15px]">
      <div className="mb-3.5 flex justify-between">
        <Skeleton className="h-[13px] w-[90px]" />
        <Skeleton className="h-[13px] w-14" />
      </div>
      <div className="flex flex-col gap-[5px]">
        <Skeleton className="ml-auto h-3.5 w-[55%]" />
        <Skeleton className="ml-auto h-3.5 w-[72%]" />
        <Skeleton className="my-2 h-3.5 w-[90%]" />
        <Skeleton className="h-3.5 w-[68%]" />
        <Skeleton className="h-3.5 w-[48%]" />
      </div>
    </Card>
  );
}

function EmptyState({ poolKey }: { poolKey: string }) {
  return (
    <Card className="flex w-full max-w-[380px] flex-col items-center justify-center gap-1.5 px-4 py-7">
      <span className="text-[13.5px] font-semibold text-ink">Empty book</span>
      <span className="text-[12px] text-muted">
        No resting orders on {poolKey.replace(/_/g, '/')}.
      </span>
    </Card>
  );
}

export function OrderbookDepth({ data }: { data: SpotOrderbook }) {
  const bids = data?.bids ?? [];
  const asks = data?.asks ?? [];

  if (!data) return <LoadingState />;
  if (bids.length === 0 && asks.length === 0) return <EmptyState poolKey={data.poolKey} />;

  const bestBid = bids[0]?.price;
  const bestAsk = asks[0]?.price;
  const mid =
    bestBid != null && bestAsk != null
      ? (bestBid + bestAsk) / 2
      : (bestBid ?? bestAsk ?? 0);

  // Asks render top-to-bottom from the mid outward (closest ask last → nearest the mid).
  // Both sides share one max so bar widths reflect true relative depth.
  const sharedMax = Math.max(totalSize(asks), totalSize(bids)) || 1;
  const askRows = cumulative(asks, sharedMax);
  const bidRows = cumulative(bids, sharedMax);
  const ticks = Math.max(askRows.length, bidRows.length);

  return (
    <Card className="w-full max-w-[380px] border-[#C9D8CF] px-4 pb-[13px] pt-[15px]">
      <Header poolKey={data.poolKey} ticks={ticks} />
      <div className="flex flex-col gap-[3px]">
        {[...askRows].reverse().map((r) => (
          <AskRow key={`a-${r.level.price}`} level={r.level} depth={r.depth} />
        ))}
        <div className="my-px flex items-center justify-center gap-2 py-1.5">
          <span className="h-px flex-1 bg-[#EDE9E0]" />
          <span className="font-mono tabular-nums text-[13px] font-bold text-ink">
            {mid.toFixed(PRICE_DP)}
          </span>
          <span className="text-[10px] uppercase tracking-[0.1em] text-[#9c978d]">mid</span>
          <span className="h-px flex-1 bg-[#EDE9E0]" />
        </div>
        {bidRows.map((r) => (
          <BidRow key={`b-${r.level.price}`} level={r.level} depth={r.depth} />
        ))}
      </div>
      <Footer />
    </Card>
  );
}
