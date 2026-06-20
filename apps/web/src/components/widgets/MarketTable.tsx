'use client';

import { Card } from '@/components/ui/Card';
import { formatCountdown } from '@/lib/format';
import type { Market } from '@/lib/bff/types';

export function MarketTable({ markets, onPick }: { markets: Market[]; onPick?: (m: Market) => void }) {
  if (!markets.length) {
    return <Card className="p-6 text-center text-sm text-muted">No open markets right now.</Card>;
  }
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center bg-[#FAF8F3] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
        <span className="flex-[2]">Market</span>
        <span className="flex-1 text-right">Expiry</span>
        <span className="w-16 text-right">Status</span>
      </div>
      {markets.slice(0, 8).map((m) => (
        <button
          key={m.oracleId}
          type="button"
          onClick={() => onPick?.(m)}
          className="flex w-full items-center border-t border-line px-4 py-3 text-left transition hover:bg-paper"
        >
          <span className="flex-[2] text-sm font-semibold">{m.asset} binary</span>
          <span className="flex-1 text-right font-mono text-xs text-muted">{formatCountdown(m.expiry)}</span>
          <span className="w-16 text-right">
            {m.status === 'active' ? (
              <span className="inline-block size-1.5 rounded-full bg-green" />
            ) : (
              <span className="font-mono text-[9px] uppercase text-faint">settled</span>
            )}
          </span>
        </button>
      ))}
    </Card>
  );
}
