'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Toc, type TocHeading } from '../content/Toc';
import { navLookup } from '@/lib/nav';

export function PageLayout({
  children,
  wide = false,
  showBreadcrumb = false,
  toc,
}: {
  children: ReactNode;
  wide?: boolean;
  showBreadcrumb?: boolean;
  toc?: TocHeading[];
}) {
  const pathname = usePathname();
  const { group, label, prev, next } = navLookup(pathname);

  return (
    <>
      <div style={{ flex: 1, maxWidth: wide ? 940 : 760, padding: '34px 44px', minWidth: 0 }}>
        {showBreadcrumb && (group || label) && (
          <div
            className="mono"
            style={{ fontSize: 11, letterSpacing: '0.04em', color: '#928d83', marginBottom: 18 }}
          >
            {group ? `${group} / ${label ?? ''}` : label}
          </div>
        )}

        {children}

        {(prev || next) && (
          <div className="twocol" style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #DED9CF' }}>
            {prev ? <PrevNextCard dir="prev" href={prev.href} label={prev.label} /> : <span />}
            {next ? <PrevNextCard dir="next" href={next.href} label={next.label} /> : <span />}
          </div>
        )}

        <Footer />
      </div>

      {toc && toc.length > 0 && <Toc toc={toc} />}
    </>
  );
}

function PrevNextCard({ dir, href, label }: { dir: 'prev' | 'next'; href: string; label: string }) {
  const next = dir === 'next';
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
        textAlign: next ? 'right' : 'left',
        display: 'block',
      }}
    >
      <div
        className="mono"
        style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#928d83', marginBottom: 5 }}
      >
        {next ? 'Next →' : '← Previous'}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{label}</div>
    </Link>
  );
}
