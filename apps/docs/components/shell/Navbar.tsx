'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mark } from '@/components/brand/Mark';
import { NAV_TABS, APP_URL, GITHUB_URL } from '@/lib/nav';

export function Navbar({
  onSearch,
  onDrawer,
}: {
  onSearch: () => void;
  onDrawer: () => void;
}) {
  const pathname = usePathname();
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(228,226,220,0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #DED9CF',
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '0 24px',
          height: 60,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            textDecoration: 'none',
            color: '#1A1714',
            flex: 'none',
          }}
        >
          <Mark size={22} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em' }}>
            DeepBookie
          </span>
          <span
            className="mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.06em',
              color: '#8a857b',
              border: '1px solid #d3cec3',
              borderRadius: 4,
              padding: '3px 6px',
            }}
          >
            DOCS
          </span>
        </Link>

        <nav
          className="dbk-navlinks"
          style={{ alignItems: 'center', gap: 4, marginLeft: 8 }}
        >
          {NAV_TABS.map((t) => {
            const active = pathname.startsWith(t.href.split('/').slice(0, 2).join('/'));
            return (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: active ? '#1A1714' : '#615c53',
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: active ? '#fff' : 'transparent',
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <button
          className="dbk-searchpill"
          onClick={onSearch}
          style={{
            alignItems: 'center',
            gap: 10,
            background: '#fff',
            border: '1px solid #E6E1D8',
            borderRadius: 99,
            padding: '8px 10px 8px 14px',
            cursor: 'pointer',
            minWidth: 210,
          }}
        >
          <span style={{ fontSize: 13.5, color: '#928d83', flex: 1, textAlign: 'left' }}>
            Search docs…
          </span>
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: '#928d83',
              border: '1px solid #E6E1D8',
              borderRadius: 5,
              padding: '2px 6px',
              background: '#FAFAF7',
            }}
          >
            ⌘K
          </span>
        </button>

        <button
          className="dbk-searchicon"
          onClick={onSearch}
          aria-label="Search"
          style={iconBtn}
        >
          <SearchIcon />
        </button>

        <a href={GITHUB_URL} aria-label="GitHub" style={{ ...iconBtn, display: 'flex' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#3c3933">
            <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.7c-2.78.62-3.37-1.22-3.37-1.22-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9l-.01 2.81c0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
          </svg>
        </a>

        <a
          className="dbk-openapp"
          href={APP_URL}
          style={{
            alignItems: 'center',
            gap: 6,
            background: '#2C5E4A',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 13.5,
            fontWeight: 600,
            padding: '9px 15px',
            borderRadius: 99,
            flex: 'none',
          }}
        >
          Open app ↗
        </a>

        <button
          className="dbk-hamb"
          onClick={onDrawer}
          aria-label="Menu"
          style={iconBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" stroke="#3c3933" strokeWidth="2" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>
    </header>
  );
}

const iconBtn = {
  width: 38,
  height: 38,
  alignItems: 'center',
  justifyContent: 'center',
  background: '#fff',
  border: '1px solid #E6E1D8',
  borderRadius: 10,
  cursor: 'pointer',
} as const;

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#615c53" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
