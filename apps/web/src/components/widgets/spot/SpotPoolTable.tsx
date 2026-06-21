'use client';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { CoinLogo } from '@/components/widgets/CoinLogo';
import { formatPct, formatUsd } from '@/lib/format';
import { useSpotMid, useSpotPoolParams } from '@/lib/hooks/useSpotRead';
import type { SpotPool } from '@/lib/bff/spot-types';

const TH = 'text-[10px] font-semibold uppercase tracking-[0.1em] text-faint';
const CTA =
  'rounded-[7px] bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-paper transition hover:opacity-90';

/** Mid with sensible precision: 4dp under 100, 2dp with thousands separators above. */
function fmtMid(mid: number): string {
  if (!mid || mid <= 0) return '—';
  if (mid >= 1000) return formatUsd(mid, 2);
  if (mid >= 1) return mid.toFixed(4);
  return mid.toPrecision(4);
}
const fmtPct = (fee: number): string => (Number.isFinite(fee) ? formatPct(fee, 2) : '—');

/** A subtle read-error marker — distinguishes a failed mid/params read from a genuine empty/zero value. */
function ErrMark() {
  return (
    <span className="font-mono text-[11px] text-clay" title="Couldn’t load — refreshing">
      ⚠
    </span>
  );
}

function PairMark({ base, quote }: { base: string; quote: string }) {
  return (
    <div className="flex flex-none">
      <CoinLogo asset={base} size={22} />
      <span className="-ml-[7px] rounded-full ring-[1.5px] ring-card">
        <CoinLogo asset={quote} size={22} />
      </span>
    </div>
  );
}

function FeeChip({ whitelisted }: { whitelisted: boolean }) {
  return whitelisted ? (
    <span className="whitespace-nowrap rounded-pill border border-[#DCEAE2] bg-[#F4F7F4] px-2.5 py-[3px] font-mono text-[9.5px] text-green">
      DEEP-free
    </span>
  ) : (
    <span className="whitespace-nowrap rounded-pill border border-line bg-[#F6F4EF] px-2.5 py-[3px] font-mono text-[9.5px] text-muted">
      fee in DEEP
    </span>
  );
}

/** One enriched row — hooks live here so they're never called in a loop. */
function PoolRow({
  pool,
  onTrade,
}: {
  pool: SpotPool;
  onTrade: (poolKey: string) => void;
}) {
  const mid = useSpotMid(pool.poolKey);
  const params = useSpotPoolParams(pool.poolKey);
  const whitelisted = !!params.data?.whitelisted;
  const midTxt = mid.data ? fmtMid(mid.data.midPrice) : '—';
  const takerTxt = params.data ? fmtPct(params.data.takerFee) : '—';

  return (
    <>
      {/* Desktop row */}
      <div className="hidden items-center border-t border-[#F2EEE6] px-[18px] py-3.5 md:flex">
        <div className="flex flex-[2] items-center gap-2.5">
          <PairMark base={pool.base} quote={pool.quote} />
          <span className="text-[13.5px] font-bold">
            {pool.base}/{pool.quote}
          </span>
        </div>
        {mid.isLoading ? (
          <span className="flex-[1.4] text-right">
            <Skeleton className="ml-auto h-3 w-14 rounded-card-in" />
          </span>
        ) : (
          <span className="flex-[1.4] text-right font-mono text-[13px] tabular-nums">
            {mid.isError ? <ErrMark /> : midTxt}
          </span>
        )}
        <span className="flex-1 text-right font-mono text-[12px] tabular-nums text-muted">
          {params.isError ? <ErrMark /> : takerTxt}
        </span>
        <span className="flex-[1.5] text-center">
          {params.isLoading ? (
            <Skeleton className="mx-auto h-4 w-16 rounded-pill" />
          ) : params.isSuccess ? (
            <FeeChip whitelisted={whitelisted} />
          ) : params.isError ? (
            <ErrMark />
          ) : (
            <span className="font-mono text-[10px] text-faint">—</span>
          )}
        </span>
        <span className="flex-[1.1] text-right">
          <button type="button" onClick={() => onTrade(pool.poolKey)} className={CTA}>
            Trade
          </button>
        </span>
      </div>

      {/* Mobile card */}
      <Card
        className={`flex flex-col gap-2.5 p-3 md:hidden ${whitelisted ? 'border-[#C9D8CF]' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PairMark base={pool.base} quote={pool.quote} />
            <span className="text-[13px] font-bold">
              {pool.base}/{pool.quote}
            </span>
          </div>
          {params.isLoading ? (
            <Skeleton className="h-4 w-16 rounded-pill" />
          ) : params.isSuccess ? (
            <FeeChip whitelisted={whitelisted} />
          ) : params.isError ? (
            <ErrMark />
          ) : (
            <span className="font-mono text-[10px] text-faint">—</span>
          )}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className={TH}>Mid</div>
            {mid.isLoading ? (
              <Skeleton className="mt-1 h-4 w-16 rounded-card-in" />
            ) : (
              <div className="mt-0.5 font-mono text-[15px] font-bold tabular-nums">
                {mid.isError ? <ErrMark /> : midTxt}
              </div>
            )}
          </div>
          <button type="button" onClick={() => onTrade(pool.poolKey)} className={`${CTA} px-4 py-[7px]`}>
            Trade
          </button>
        </div>
      </Card>
    </>
  );
}

/** Directory of DeepBook V3 spot markets: mid, taker fee, whitelist chip → Trade. */
export function SpotPoolTable({
  pools,
  onTrade,
}: {
  pools: SpotPool[];
  onTrade: (poolKey: string) => void;
}) {
  if (!pools.length) {
    return (
      <Card className="flex h-[152px] flex-col items-center justify-center gap-2 text-center">
        <span className="h-[30px] w-[30px] rounded-card-in bg-[#F2EEE6]" />
        <span className="text-[13.5px] font-semibold">No pools</span>
        <span className="text-[12px] text-muted">No spot markets are live.</span>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="flex items-center border-b border-[#EDE9E0] bg-[#FAF8F3] px-[18px] py-[11px]">
          <span className={`${TH} flex-[2]`}>Pair</span>
          <span className={`${TH} flex-[1.4] text-right`}>Mid</span>
          <span className={`${TH} flex-1 text-right`}>Taker</span>
          <span className={`${TH} flex-[1.5] text-center`}>Fees</span>
          <span className="flex-[1.1]" />
        </div>
        {pools.map((pool) => (
          <PoolRow key={pool.poolKey} pool={pool} onTrade={onTrade} />
        ))}
      </Card>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {pools.map((pool) => (
          <PoolRow key={pool.poolKey} pool={pool} onTrade={onTrade} />
        ))}
      </div>
    </>
  );
}
