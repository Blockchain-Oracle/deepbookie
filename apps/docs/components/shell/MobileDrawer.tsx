'use client';

import Link from 'next/link';
import { NAV } from '@/lib/nav';

export function MobileDrawer({
  open,
  onClose,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(26,23,20,.4)',
          backdropFilter: 'blur(2px)',
        }}
      />
      <div
        className="rise"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 300,
          maxWidth: '84vw',
          background: '#F4F2EC',
          boxShadow: '0 0 60px rgba(26,23,20,.4)',
          overflowY: 'auto',
          padding: '18px 16px 40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em' }}>
            DeepBookie
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              background: '#fff',
              border: '1px solid #E6E1D8',
              borderRadius: 9,
              cursor: 'pointer',
              fontSize: 16,
              color: '#615c53',
            }}
          >
            ✕
          </button>
        </div>
        <button
          onClick={() => {
            onClose();
            onSearch();
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#fff',
            border: '1px solid #E6E1D8',
            borderRadius: 10,
            padding: '10px 12px',
            marginBottom: 18,
            cursor: 'pointer',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#928d83" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <span style={{ fontSize: 13.5, color: '#928d83' }}>Search…</span>
        </button>
        {NAV.map((grp) => (
          <div key={grp.id} style={{ marginBottom: 16 }}>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#928d83',
                fontWeight: 600,
                padding: '0 8px',
                marginBottom: 5,
              }}
            >
              {grp.label}
            </div>
            {grp.items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={onClose}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  fontSize: 14.5,
                  padding: '8px 10px',
                  borderRadius: 7,
                  color: '#615c53',
                }}
              >
                {it.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
