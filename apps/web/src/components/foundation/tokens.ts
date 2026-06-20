/**
 * Design tokens (TS mirror of the @theme layer in globals.css).
 * Used where a raw value is needed — SVG charts, the receipt stamp, and the
 * dapp-kit CSS-var theme (Phase 2). Tailwind utilities read the same values from CSS.
 */
export const COLORS = {
  ink: '#1A1714',
  paper: '#F4F2EC',
  canvas: '#E4E2DC',
  card: '#FFFFFF',
  green: '#2C5E4A', // up / live / signed
  mint: '#7FCAA6',
  clay: '#B0452B', // down / error
  wallet: '#4DA2FF', // Sui wallet blue
  line: '#E6E1D8',
  lineStrong: '#DED9CF',
  muted: '#8A857B',
  faint: '#9C978D',
  inkSoft: '#3C3933',
  shimmer: '#ECE8DF',
} as const;

export const RADIUS = { cardIn: 8, card: 14, phone: 42, pill: 999 } as const;

export const SHADOW = {
  raised: '0 18px 40px -22px rgba(26,23,20,.3)',
  float: '0 28px 64px -26px rgba(26,23,20,.45)',
} as const;
