'use client';

import type { ReactNode } from 'react';
import type { MotifKind } from './categories';

/** The 30px tinted icon for a mobile category tile (and the featured-hero header), keyed by motif. */
export function TileIcon({ kind }: { kind: MotifKind }) {
  const { bg, color, path } = ICONS[kind];
  return (
    <span className="flex size-[30px] flex-none items-center justify-center rounded-[9px]" style={{ background: bg, color }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        {path}
      </svg>
    </span>
  );
}

const GREEN_BG = 'rgb(44 94 74 / 0.10)';
const BLUE_BG = 'rgb(77 162 255 / 0.13)';
const MINT_BG = 'rgb(127 202 166 / 0.22)';
const INK_BG = '#F1EFEA';

const ICONS: Record<MotifKind, { bg: string; color: string; path: ReactNode }> = {
  oddsCurve: { bg: GREEN_BG, color: '#2C5E4A', path: (<><path d="M3 16l5-6 4 3 6-8" /><path d="M14 5h4v4" /></>) },
  upDown: { bg: GREEN_BG, color: '#2C5E4A', path: (<><path d="M7 9l5-5 5 5" /><path d="M7 15l5 5 5-5" /></>) },
  swap: { bg: BLUE_BG, color: '#3D8BE0', path: (<><path d="M16 3l4 4-4 4" /><path d="M20 7H5" /><path d="M8 21l-4-4 4-4" /><path d="M4 17h15" /></>) },
  depth: { bg: BLUE_BG, color: '#3D8BE0', path: (<g fill="currentColor" stroke="none"><rect x="3" y="5.5" width="13" height="3" rx="1.5" /><rect x="3" y="10.5" width="18" height="3" rx="1.5" /><rect x="3" y="15.5" width="9" height="3" rx="1.5" /></g>) },
  countUp: { bg: MINT_BG, color: '#2C5E4A', path: (<><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M16 12.5h2" /></>) },
  vaultStack: { bg: GREEN_BG, color: '#2C5E4A', path: (<><ellipse cx="12" cy="6.5" rx="7" ry="3" /><path d="M5 6.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /><path d="M5 12.5v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" /></>) },
  stakeBadge: { bg: GREEN_BG, color: '#2C5E4A', path: (<path d="M12 3l5.5 9-5.5 9-5.5-9z" fill="currentColor" stroke="none" />) },
  govTags: { bg: INK_BG, color: '#1A1714', path: (<><rect x="4" y="4" width="16" height="16" rx="3.5" /><path d="M8.5 12l2.5 2.5 5-5" /></>) },
  receipt: { bg: INK_BG, color: '#6f6a60', path: (<><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3 8.5" /><path d="M3 4v4.5h4.5" /><path d="M12 8v4.2l3 1.8" /></>) },
};
