'use client';

export type TocHeading = { value: string; id: string; depth: number };

export function Toc({ toc }: { toc: TocHeading[] }) {
  return (
    <aside
      className="dbk-toc"
      style={{
        width: 188,
        flex: 'none',
        position: 'sticky',
        top: 60,
        alignSelf: 'flex-start',
        padding: '34px 24px 40px 8px',
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#928d83',
          fontWeight: 600,
          marginBottom: 14,
        }}
      >
        On this page
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderLeft: '1px solid #E6E1D8' }}>
        {toc
          .filter((h) => h.depth <= 3)
          .map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              style={{
                fontSize: 12.5,
                textDecoration: 'none',
                color: '#615c53',
                padding: `5px 0 5px ${h.depth >= 3 ? 22 : 12}px`,
                marginLeft: -1,
                borderLeft: '2px solid transparent',
              }}
            >
              {h.value}
            </a>
          ))}
      </div>
    </aside>
  );
}
