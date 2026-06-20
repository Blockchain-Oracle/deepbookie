import { Card } from '@/components/ui/Card';
import { KV } from './kit';
import { formatUsd } from '@/lib/format';
import type { RangeQuote } from '@/lib/bff/types';

const LOW = 90;
const HIGH = 210;
const TOP = 24;
const BASE = 92;

export function RangePayoff({ quote }: { quote: RangeQuote }) {
  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13.5px] font-bold">
          In ${formatUsd(quote.lowerStrikeUsd, 0)}–${formatUsd(quote.higherStrikeUsd, 0)}
        </span>
        <span className="font-mono text-[11px] text-muted">band pays</span>
      </div>
      <svg viewBox="0 0 300 110" className="block w-full" role="img" aria-label="range payoff">
        <line x1="10" y1={BASE} x2="296" y2={BASE} stroke="#E4DFD5" />
        <rect x={LOW} y={TOP} width={HIGH - LOW} height={BASE - TOP} fill="#2C5E4A" opacity="0.08" />
        <path
          d={`M10,${BASE} L${LOW},${BASE} L${LOW},${TOP} L${HIGH},${TOP} L${HIGH},${BASE} L296,${BASE}`}
          fill="none"
          stroke="#2C5E4A"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <line x1={LOW} y1="14" x2={LOW} y2="100" stroke="#c2bcb0" strokeWidth="1" strokeDasharray="2 3" />
        <line x1={HIGH} y1="14" x2={HIGH} y2="100" stroke="#c2bcb0" strokeWidth="1" strokeDasharray="2 3" />
        <text x={LOW} y="108" className="font-mono" style={{ fontSize: 8.5, fill: '#9c978d' }} textAnchor="middle">
          ${formatUsd(quote.lowerStrikeUsd, 0)}
        </text>
        <text x={HIGH} y="108" className="font-mono" style={{ fontSize: 8.5, fill: '#9c978d' }} textAnchor="middle">
          ${formatUsd(quote.higherStrikeUsd, 0)}
        </text>
      </svg>
      <div className="mt-2 border-t border-line pt-2">
        <KV label="Cost" value={`${formatUsd(quote.mintCostUsd)} dUSDC`} />
        <KV label="Max payout" value={`${formatUsd(quote.quantityUsd)} dUSDC`} strong accent />
      </div>
    </Card>
  );
}
