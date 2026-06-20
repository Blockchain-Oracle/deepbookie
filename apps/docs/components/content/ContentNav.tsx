'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navLookup } from '@/lib/nav';

/** Client-only breadcrumb (top) + prev/next (bottom) for MDX content pages. */
export function ContentNav({ position }: { position: 'top' | 'bottom' }) {
  const pathname = usePathname();
  const { group, label, prev, next } = navLookup(pathname);

  if (position === 'top') {
    if (!group && !label) return null;
    return (
      <div
        className="mono"
        style={{ fontSize: 11, letterSpacing: '0.04em', color: '#928d83', marginBottom: 18 }}
      >
        {group ? `${group} / ${label ?? ''}` : label}
      </div>
    );
  }

  if (!prev && !next) return null;
  return (
    <div className="twocol" style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #DED9CF' }}>
      {prev ? <Card dir="prev" href={prev.href} label={prev.label} /> : <span />}
      {next ? <Card dir="next" href={next.href} label={next.label} /> : <span />}
    </div>
  );
}

function Card({ dir, href, label }: { dir: 'prev' | 'next'; href: string; label: string }) {
  const isNext = dir === 'next';
  return (
    <Link
      href={href}
      className="intent-card"
      style={{
        textDecoration: 'none',
        color: '#1A1714',
        border: '1px solid #E6E1D8',
        background: '#fff',
        borderRadius: 12,
        padding: '15px 18px',
        textAlign: isNext ? 'right' : 'left',
        display: 'block',
      }}
    >
      <div
        className="mono"
        style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#928d83', marginBottom: 5 }}
      >
        {isNext ? 'Next →' : '← Previous'}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{label}</div>
    </Link>
  );
}
