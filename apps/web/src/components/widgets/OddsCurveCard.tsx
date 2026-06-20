'use client';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Odds, OddsPoint, Direction } from '@/lib/bff/types';
import { formatCountdown, formatPct, formatStrikeShort, formatUsd } from '@/lib/format';

const W = 320;
const H = 150;
const PAD_L = 26;
const PAD_T = 6;
const PAD_B = 22;

function scaleX(strike: number, min: number, max: number) {
  return PAD_L + ((strike - min) / (max - min || 1)) * (W - PAD_L - 4);
}
function scaleY(prob: number) {
  return PAD_T + (1 - prob) * (H - PAD_T - PAD_B);
}

function nearest(curve: OddsPoint[], strike: number): OddsPoint {
  return curve.reduce((a, b) => (Math.abs(b.strike - strike) < Math.abs(a.strike - strike) ? b : a));
}

function CurveHeader({ asset, spot, expiry, settled }: { asset: string; spot: number; expiry: number; settled: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="flex size-[22px] items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper">₿</span>
        <span className="text-sm font-bold">{asset}</span>
        <span className="font-mono text-xs text-muted">${formatUsd(spot)}</span>
      </div>
      {settled ? (
        <span className="rounded-pill border border-line-strong px-2 py-1 font-mono text-[10px] uppercase text-muted">settled</span>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-green" />
          <span className="font-mono text-[10.5px] font-medium text-green">live · {formatCountdown(expiry)}</span>
        </span>
      )}
    </div>
  );
}

export interface OddsCurveCardProps {
  status?: 'loading' | 'empty' | 'error' | 'live';
  odds?: Odds;
  asset?: string;
  strikeUsd?: number; // selected strike (defaults to nearest spot)
  settled?: boolean;
  onBet?: (direction: Direction, strikeUsd: number) => void;
}

export function OddsCurveCard({ status = 'live', odds, asset = 'BTC', strikeUsd, settled, onBet }: OddsCurveCardProps) {
  if (status === 'loading' || (status === 'live' && !odds)) {
    return (
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-[130px] w-full" />
        <div className="mt-3 flex gap-3 border-t border-line pt-3">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </Card>
    );
  }
  if (status === 'empty') {
    return (
      <Card className="flex h-[233px] flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="text-sm font-bold">No live {asset} market</span>
        <span className="max-w-[230px] text-xs text-muted">The current round just settled — the next opens shortly.</span>
      </Card>
    );
  }
  if (status === 'error' || !odds) {
    return (
      <Card className="flex h-[233px] flex-col items-center justify-center gap-2 border-[#E6C9BE] p-4 text-center">
        <span className="flex size-8 items-center justify-center rounded-full border border-clay text-lg text-clay">!</span>
        <span className="text-sm font-bold">Couldn’t load the curve</span>
        <span className="text-xs text-muted">The price indexer didn’t respond.</span>
      </Card>
    );
  }

  const sel = nearest(odds.curve, strikeUsd ?? odds.spot);
  const xs = odds.curve.map((p) => p.strike);
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const line = odds.curve
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.strike, min, max).toFixed(1)},${scaleY(p.probabilityUp).toFixed(1)}`)
    .join(' ');
  const area = `${line} L${scaleX(max, min, max).toFixed(1)},${H - PAD_B} L${scaleX(min, min, max).toFixed(1)},${H - PAD_B} Z`;
  const mx = scaleX(sel.strike, min, max);
  const my = scaleY(sel.probabilityUp);
  const spotX = scaleX(odds.spot, min, max);
  const labels = [min, (min + max) / 2, max];

  return (
    <Card className="border-[#C9D8CF] p-4">
      <CurveHeader asset={asset} spot={odds.spot} expiry={odds.expiry} settled={!!settled} />
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="probability curve">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={PAD_L} y1={scaleY(g)} x2={W - 4} y2={scaleY(g)} stroke="#F0ECE3" />
        ))}
        {[0, 0.5, 1].map((g) => (
          <text key={g} x={6} y={scaleY(g) + 3} className="font-mono" style={{ fontSize: 8, fill: '#c2bdb2' }}>
            {g * 100}
          </text>
        ))}
        <defs>
          <linearGradient id="oc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2C5E4A" stopOpacity="0.13" />
            <stop offset="1" stopColor="#2C5E4A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#oc-fill)" />
        <path d={line} fill="none" stroke="#2C5E4A" strokeWidth={2} />
        <line x1={spotX} y1={PAD_T} x2={spotX} y2={H - PAD_B} stroke="#c2bcb0" strokeWidth={1} strokeDasharray="2 3" />
        <line x1={mx} y1={PAD_T} x2={mx} y2={H - PAD_B} stroke="#1A1714" strokeWidth={1} />
        <circle cx={mx} cy={my} r={4.5} fill="#fff" stroke="#2C5E4A" strokeWidth={2.5} />
      </svg>
      <div className="flex justify-between pl-[26px] pt-1 font-mono text-[9px] text-[#b0aa9f]">
        {labels.map((l, i) => (
          <span key={i}>{formatStrikeShort(l)}</span>
        ))}
      </div>
      <div className="mt-3 flex border-t border-line pt-3">
        <Stat label="Strike" value={`$${formatUsd(sel.strike, 0)}`} />
        <Stat label="P(up)" value={formatPct(sel.probabilityUp)} accent />
        <Stat label="P(down)" value={formatPct(1 - sel.probabilityUp)} />
      </div>
      {!settled && onBet && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onBet('UP', sel.strike)}
            className="flex-1 rounded-card-in bg-ink py-2.5 text-sm font-semibold text-paper transition hover:opacity-90"
          >
            Bet UP
          </button>
          <button
            type="button"
            onClick={() => onBet('DOWN', sel.strike)}
            className="flex-1 rounded-card-in border border-line-strong py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-paper"
          >
            Bet DOWN
          </button>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">{label}</div>
      <div className={`mt-0.5 font-mono text-[15px] font-bold tabular-nums ${accent ? 'text-green' : 'text-ink'}`}>
        {value}
      </div>
    </div>
  );
}
