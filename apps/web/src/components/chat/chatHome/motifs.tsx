'use client';

import type { CSSProperties, ReactNode } from 'react';
import { CountUp } from './CountUp';
import type { MotifKind } from './categories';

const CURVE = 'M2 30 C30 28 48 14 72 16 C100 18 120 6 150 8 C170 9 186 5 198 4';

/** The living-detail motif for a rail card. Animations are CSS classes (globals.css), all paused
 *  under prefers-reduced-motion by the global guard. `big` is the larger mobile featured-hero curve. */
export function Motif({ kind, big }: { kind: MotifKind; big?: boolean }) {
  switch (kind) {
    case 'oddsCurve':
      return <OddsCurve big={big} />;
    case 'upDown':
      return (
        <div className="my-[11px] flex gap-[7px]">
          <div className="pulse-up flex flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-[#DCEAE2] bg-[#F4F7F4] py-[7px] text-[12px] font-bold text-green">
            ▲ UP
          </div>
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-[#E6C9BE] bg-[#FBF1EC] py-[7px] text-[12px] font-bold text-clay">
            ▼ DOWN
          </div>
        </div>
      );
    case 'swap':
      return (
        <div className="my-[11px] flex items-center gap-[9px]">
          <span className="flex size-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper">$</span>
          <span className="swapg flex size-[26px] items-center justify-center rounded-[8px] border border-line bg-[#F6F4EF] text-[13px] text-ink-soft transition-transform duration-[400ms] group-hover:rotate-180">
            ⇅
          </span>
          <span className="flex size-6 items-center justify-center rounded-full bg-wallet text-[11px] font-bold text-white">S</span>
          <span className="ml-0.5 font-mono text-[11px] text-muted">SUI → DBUSDC</span>
        </div>
      );
    case 'depth':
      return (
        <div className="my-[11px] flex flex-col gap-1">
          <div className="flex items-center gap-[7px]">
            <span className="w-[34px] font-mono text-[9.5px] tabular-nums text-green">4.206</span>
            <span className="breathe-a h-2 w-[62%] rounded-[3px] bg-[#E3EDE6]" />
          </div>
          <div className="flex items-center gap-[7px]">
            <span className="w-[34px] font-mono text-[9.5px] tabular-nums text-clay">4.214</span>
            <span className="breathe-b h-2 w-[44%] rounded-[3px] bg-[#F6E4DE]" />
          </div>
        </div>
      );
    case 'countUp':
      return (
        <div className="my-[11px]">
          <div className="mb-px text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">Est. value</div>
          <CountUp to={1284.1} className="font-mono text-[20px] font-semibold tabular-nums tracking-[-0.02em]" />
        </div>
      );
    case 'vaultStack':
      return (
        <div className="my-[11px] flex h-[30px] items-center gap-2.5">
          <span className="drift relative h-[26px] w-[42px]">
            <Disc style={{ left: 0 }} bg="bg-ink" fg="text-paper">$</Disc>
            <Disc style={{ left: 13 }} bg="bg-green" fg="text-white" ring>◈</Disc>
            <Disc style={{ left: 26 }} bg="bg-mint" fg="text-ink" ring>P</Disc>
          </span>
          <span className="font-mono text-[11px] text-muted">pooled depth</span>
        </div>
      );
    case 'stakeBadge':
      return (
        <div className="my-[11px] flex items-center gap-[9px]">
          <span className="drift flex size-7 items-center justify-center rounded-full bg-green text-[14px] font-bold text-white">◈</span>
          <span className="rounded-pill border border-[#DCEAE2] bg-[#F4F7F4] px-2.5 py-[3px] text-[11.5px] font-bold text-green">fees −40%</span>
        </div>
      );
    case 'govTags':
      return (
        <div className="my-[11px] flex gap-[5px]">
          <Tag>propose</Tag>
          <Tag>vote</Tag>
          <Tag accent>claim</Tag>
        </div>
      );
    case 'receipt':
      return (
        <div className="my-[11px] flex h-[30px] items-center gap-[9px]">
          <span
            className="relative block h-[30px] w-[26px] rounded-t-[4px] border border-line bg-white"
            style={{ clipPath: 'polygon(0 0,100% 0,100% 86%,86% 100%,72% 86%,58% 100%,44% 86%,30% 100%,16% 86%,0 100%)' }}
          >
            <span className="absolute left-1 right-1 top-[6px] h-0.5 bg-line" />
            <span className="absolute left-1 right-[9px] top-3 h-0.5 bg-[#EDE9E0]" />
            <span className="absolute left-1 right-1.5 top-[18px] h-0.5 bg-[#EDE9E0]" />
          </span>
          <span className="font-mono text-[11px] text-muted">12 sessions</span>
        </div>
      );
  }
}

function OddsCurve({ big }: { big?: boolean }) {
  const h = big ? 38 : 30;
  return (
    <div className="relative my-[10px]" style={{ height: h }}>
      <svg viewBox="0 0 200 40" width="100%" height={h} preserveAspectRatio="none">
        <path d={`${CURVE} L198 40 L2 40 Z`} fill="#2C5E4A" opacity="0.06" />
        <path d={CURVE} fill="none" stroke="#2C5E4A" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {!big && (
        <span
          className="spark-dot absolute size-[7px] rounded-full border-[1.5px] border-white bg-green"
          style={{ offsetPath: `path('${CURVE}')`, boxShadow: '0 0 0 2px rgb(44 94 74 / 0.18)', top: -3.5, left: -3.5 }}
        />
      )}
      <span className="absolute right-0 top-[-4px] font-mono text-[13px] font-semibold tabular-nums text-green">62%</span>
    </div>
  );
}

function Disc({ children, style, bg, fg, ring }: { children: ReactNode; style: CSSProperties; bg: string; fg: string; ring?: boolean }) {
  return (
    <span
      className={`absolute top-[3px] flex size-5 items-center justify-center rounded-full text-[9px] font-bold ${bg} ${fg} ${ring ? 'border-[1.5px] border-white' : ''}`}
      style={style}
    >
      {children}
    </span>
  );
}

function Tag({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className={`rounded-pill border px-2 py-[3px] font-mono text-[9.5px] ${accent ? 'border-[#DCEAE2] bg-[#F4F7F4] text-green' : 'border-[#EDE9E0] bg-[#F6F4EF] text-ink-soft'}`}
    >
      {children}
    </span>
  );
}
