import type { ReactNode } from 'react';
import type { Direction } from '@/lib/bff/types';

export function Label({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <div className={`text-[10px] font-semibold uppercase tracking-[0.13em] ${accent ? 'text-green' : 'text-faint'}`}>
      {children}
    </div>
  );
}

export function KV({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between py-1.5 text-[13px]">
      <span className="text-[#7d7870]">{label}</span>
      <span className={`font-mono tabular-nums ${strong ? 'font-bold' : 'font-medium'} ${accent ? 'text-green' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}

export function DirBadge({ direction }: { direction: Direction }) {
  const up = direction === 'UP';
  return (
    <span className={`rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold ${up ? 'border-green text-green' : 'border-clay text-clay'}`}>
      {direction}
    </span>
  );
}
