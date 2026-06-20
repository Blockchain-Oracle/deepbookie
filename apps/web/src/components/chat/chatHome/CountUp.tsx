'use client';

import { useEffect, useState } from 'react';

const fmt = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Decorative count-up for the "Your account" launcher motif (ease-out cubic over 1.2s). It is a
 * living-detail flourish, not the user's real balance. Renders the final value immediately when
 * prefers-reduced-motion is set, and SSRs the final string so there is no hydration flash.
 */
export function CountUp({ to, className }: { to: number; className?: string }) {
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const dur = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);

  return <span className={className}>{fmt(value)}</span>;
}
