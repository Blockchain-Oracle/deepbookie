import type { ReactNode } from 'react';

export type Step = { title: string; body: ReactNode };

/** Numbered vertical rail — first node green, rest outlined (matches the design). */
export function Steps({ items }: { items: Step[] }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 38, margin: '18px 0' }}>
      <div
        style={{ position: 'absolute', left: 13, top: 8, bottom: 24, width: 2, background: '#E6E1D8' }}
      />
      {items.map((s, i) => (
        <div key={i} style={{ position: 'relative', marginBottom: i === items.length - 1 ? 0 : 22 }}>
          <div
            style={{
              position: 'absolute',
              left: -38,
              top: -2,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: i === 0 ? '#2C5E4A' : '#fff',
              border: i === 0 ? 'none' : '2px solid #E6E1D8',
              color: i === 0 ? '#fff' : '#8a857b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {i + 1}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1714', marginBottom: 3 }}>
            {s.title}
          </div>
          <div style={{ fontSize: 14.5, color: '#615c53', lineHeight: 1.6 }}>{s.body}</div>
        </div>
      ))}
    </div>
  );
}
