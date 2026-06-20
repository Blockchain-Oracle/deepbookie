/** The DeepBookie mark — a speech bubble whose line is the odds curve. */
export function BrandMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        d="M18 14 H82 A12 12 0 0 1 94 26 V66 A12 12 0 0 1 82 78 H40 L24 92 V78 H18 A12 12 0 0 1 6 66 V26 A12 12 0 0 1 18 14 Z"
        fill="var(--color-ink)"
      />
      <path
        d="M22 60 C38 56 46 40 50 40 C56 40 62 34 78 26"
        fill="none"
        stroke="var(--color-paper)"
        strokeWidth={6.5}
        strokeLinecap="round"
      />
      <circle cx="78" cy="26" r="7.5" fill="var(--color-mint)" />
    </svg>
  );
}
