'use client';

import { useEffect, useState } from 'react';

const fmt = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Decorative count-up for the "Your account" launcher motif (ease-out cubic over 1.2s). It is a
 * living-detail flourish, not the user's real balance. Starts at 0 (SSR + first client render match,
 * so no hydration mismatch) and animates up; with prefers-reduced-motion it snaps to the final value.
 */
export function CountUp({ to, className }: { to: number; className?: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(to); // reduced motion → show the final value, no animation (don't strand at 0)
      return;
    }
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
