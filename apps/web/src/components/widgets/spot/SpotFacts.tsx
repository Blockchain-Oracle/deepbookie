'use client';

import { Card } from '@/components/ui/Card';
import { formatPct, formatUsd, num, poolLabel } from '@/lib/format';
import type { SpotCoinBalance, SpotMid, SpotPoolParams, SpotSwapQuote } from '@/lib/bff/spot-types';

/** A compact key/value card for the informational spot reads that don't warrant a bespoke widget
 *  (mid price, pool params, a swap quote preview, a coin balance). The rich flows live in SwapCard /
 *  LimitOrderTicket / OrderbookDepth; this just makes a direct agent read legible. */
export function SpotFacts({ name, data }: { name: string; data: unknown }) {
  const { label, rows } = factsFor(name, data);
  if (!rows.length) return null;
  return (
    <Card className="p-3.5">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className="flex flex-col gap-1">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-[13px]">
            <span className="text-muted">{r.label}</span>
            <span className="font-mono font-medium tabular-nums text-ink">{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function factsFor(name: string, data: unknown): { label: string; rows: { label: string; value: string }[] } {
  const d = (data ?? {}) as Record<string, unknown>;
  const pool = typeof d.poolKey === 'string' ? poolLabel(d.poolKey) : '';
  switch (name) {
    case 'spot_mid_price': {
      const m = data as SpotMid;
      return { label: `${pool} · mid price`, rows: [{ label: 'Mid', value: formatUsd(num(m.midPrice), 4) }] };
    }
    case 'spot_pool_params': {
      const p = data as SpotPoolParams;
      return {
        label: `${pool} · pool params`,
        rows: [
          { label: 'Taker fee', value: formatPct(num(p.takerFee), 3) },
          { label: 'Maker fee', value: formatPct(num(p.makerFee), 3) },
          { label: 'Tick / lot / min', value: `${formatUsd(num(p.tickSize), 4)} / ${num(p.lotSize)} / ${num(p.minSize)}` },
          { label: 'Fees', value: p.whitelisted ? 'DEEP-free (whitelisted)' : 'paid in DEEP' },
        ],
      };
    }
    case 'spot_swap_quote': {
      const q = data as SpotSwapQuote;
      const out = num(q.baseOut) > 0 ? `${formatUsd(num(q.baseOut), 4)} base` : `${formatUsd(num(q.quoteOut), 4)} quote`;
      return {
        label: `${pool} · swap quote`,
        rows: [
          { label: 'You receive ≈', value: out },
          { label: 'DEEP fee', value: formatUsd(num(q.deepRequired), 4) },
        ],
      };
    }
    case 'spot_balance': {
      const b = data as SpotCoinBalance;
      return { label: 'Balance', rows: [{ label: b.coinKey ?? 'Coin', value: formatUsd(num(b.balance), 4) }] };
    }
    default:
      return { label: name, rows: [] };
  }
}
