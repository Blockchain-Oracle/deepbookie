import type { ReactNode } from 'react';

type Kind = 'note' | 'tip' | 'warning' | 'danger';

const STYLES: Record<Kind, { bg: string; border: string; label: string; stroke: string; text?: string }> = {
  note: { bg: '#F4F2EC', border: '#DED9CF', label: 'Note', stroke: '#615c53' },
  tip: { bg: '#F4F7F4', border: '#DCEAE2', label: 'Tip', stroke: '#2C5E4A' },
  warning: { bg: '#FBF6EC', border: '#ECDCBC', label: 'Warning', stroke: '#9c7a2a', text: '#6b5a30' },
  danger: { bg: '#FBF1EC', border: '#E6C9BE', label: 'Danger', stroke: '#B0452B', text: '#7a2a1a' },
};

function Icon({ kind, stroke }: { kind: Kind; stroke: string }) {
  const common = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 2 } as const;
  if (kind === 'tip')
    return (
      <svg {...common} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 2 }}>
        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2h6c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z" />
      </svg>
    );
  if (kind === 'warning')
    return (
      <svg {...common} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 2 }}>
        <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
    );
  // note + danger use a circle-info / circle-alert
  return (
    <svg {...common} style={{ flex: 'none', marginTop: 2 }}>
      <circle cx="12" cy="12" r="9" />
      {kind === 'danger' ? <path d="M12 8v5M12 16h.01" /> : <path d="M12 16v-5M12 8h.01" />}
    </svg>
  );
}

export function Callout({ type = 'note', children }: { type?: Kind; children: ReactNode }) {
  const s = STYLES[type];
  return (
    <div
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 11,
        padding: '13px 15px',
        display: 'flex',
        gap: 11,
        margin: '16px 0',
      }}
    >
      <Icon kind={type} stroke={s.stroke} />
      <div>
        <span
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: s.stroke,
            fontWeight: 600,
          }}
        >
          {s.label}
        </span>
        <div style={{ fontSize: 14, lineHeight: 1.55, marginTop: 3, color: s.text ?? '#3c3933' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
