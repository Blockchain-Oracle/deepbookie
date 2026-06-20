import type { ReactNode } from 'react';

type Tone = 'neutral' | 'green' | 'clay' | 'amber';

const TONES: Record<Tone, string> = {
  neutral: 'border-line-strong text-muted',
  green: 'border-green/30 bg-green/5 text-green',
  clay: 'border-clay/30 bg-clay/5 text-clay',
  amber: 'border-amber-300 bg-amber-50 text-amber-700',
};

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
