import Link from 'next/link';
import { Mark } from '@/components/brand/Mark';
import { PageLayout } from '@/components/shell/PageLayout';

/** Custom 404 — a void receipt: the page that was never signed. */
export default function NotFound() {
  return (
    <PageLayout>
      <div
        className="rise"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '60px 20px 80px',
        }}
      >
      {/* a void (dashed) receipt */}
      <div
        style={{
          width: 320,
          maxWidth: '100%',
          background: '#FBFAF7',
          border: '1px dashed #D8CFC2',
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 28,
        }}
      >
        <div style={{ height: 0, borderTop: '2px dashed #B0856B' }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '13px 16px',
          }}
        >
          <span className="lbl" style={{ color: '#a8a298' }}>
            Page confirmation
          </span>
          <span
            className="mono"
            style={{
              fontSize: 9.5,
              color: '#a8a298',
              border: '1px solid #E2DDD3',
              borderRadius: 99,
              padding: '2px 8px',
            }}
          >
            404 · VOID
          </span>
        </div>
        <div style={{ padding: '4px 16px 20px' }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: '#a8a298',
              textDecoration: 'line-through',
              textDecorationColor: '#cabfb0',
              letterSpacing: '-0.02em',
            }}
          >
            This page doesn’t exist
          </div>
          <div style={{ fontSize: 12.5, color: '#a8a298', marginTop: 6 }}>
            Nothing was signed — the route returned no document.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Mark size={20} />
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em' }}>
          Lost the thread?
        </span>
      </div>
      <p style={{ fontSize: 15, color: '#615c53', maxWidth: 420, lineHeight: 1.6, margin: '0 0 22px' }}>
        That page isn’t here. Head back to the docs home, or jump straight to the tool reference.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            background: '#2C5E4A',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 14.5,
            fontWeight: 600,
            padding: '11px 18px',
            borderRadius: 99,
          }}
        >
          Back to docs home →
        </Link>
        <Link
          href="/tools"
          style={{
            background: '#fff',
            border: '1px solid #E6E1D8',
            color: '#1A1714',
            textDecoration: 'none',
            fontSize: 14.5,
            fontWeight: 600,
            padding: '11px 18px',
            borderRadius: 99,
          }}
        >
          Browse the 44 tools
        </Link>
      </div>
      </div>
    </PageLayout>
  );
}
