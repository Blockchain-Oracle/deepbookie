import type { ReactNode } from 'react';

type Accent = 'ink' | 'green' | 'clay';

const ACCENT: Record<Accent, string> = {
  ink: 'text-ink',
  green: 'text-green',
  clay: 'text-clay',
};

export function Stat({
  label,
  value,
  accent = 'ink',
}: {
  label: string;
  value: ReactNode;
  accent?: Accent;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">{label}</div>
      <div className={`mt-1 font-mono text-lg font-bold tabular-nums ${ACCENT[accent]}`}>{value}</div>
    </div>
  );
}
