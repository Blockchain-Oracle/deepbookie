'use client';

import { useMemo, useState } from 'react';
import { TOOLS, FAMILIES, type Surface } from '@/lib/tools-data';

export function ToolsCatalog({ initialSurface }: { initialSurface?: Surface }) {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<string>('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const surface = initialSurface;

  const visibleFamilies = surface ? FAMILIES.filter((f) => f.surface === surface) : FAMILIES;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (surface && t.surface !== surface) return false;
      if (family !== 'all' && t.family !== family) return false;
      if (q && !(t.name.includes(q) || t.desc.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [query, family, surface]);

  const chips = [
    { id: 'all', label: surface ? `All ${surface}` : 'All', count: TOOLS.filter((t) => !surface || t.surface === surface).length },
    ...visibleFamilies.map((f) => ({ id: f.id, label: f.name, count: TOOLS.filter((t) => t.family === f.id).length })),
  ];

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
        Tool reference
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: 16, lineHeight: 1.55, color: '#6f6a60', maxWidth: 680 }}>
        Every tool the agent can call, across Predict and Spot — <b>44 in eight families</b>. Read
        tools are free; <b>you-sign</b> tools return an unsigned transaction.
      </p>

      {/* sticky filter bar */}
      <div style={{ position: 'sticky', top: 60, zIndex: 20, background: '#E4E2DC', padding: '14px 0 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#fff',
            border: '1px solid #E6E1D8',
            borderRadius: 11,
            padding: '11px 14px',
            marginBottom: 12,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#928d83" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter tools by name or description…"
            className="mono"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1A1714', background: 'none' }}
          />
          <span className="mono" style={{ fontSize: 11, color: '#9c978d' }}>
            {filtered.length} shown
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {chips.map((c) => {
            const active = family === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFamily(c.id)}
                className="mono"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '7px 12px',
                  borderRadius: 99,
                  cursor: 'pointer',
                  color: active ? '#fff' : '#615c53',
                  background: active ? '#2C5E4A' : '#fff',
                  border: `1px solid ${active ? '#2C5E4A' : '#E6E1D8'}`,
                }}
              >
                <span>{c.label}</span>
                <span style={{ opacity: 0.6, fontSize: 10.5 }}>{c.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* family groups */}
      {visibleFamilies
        .filter((f) => filtered.some((t) => t.family === f.id))
        .map((f) => {
          const rows = filtered.filter((t) => t.family === f.id);
          return (
            <div key={f.id} style={{ marginBottom: 30 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: '1px solid #DED9CF',
                }}
              >
                <SurfacePill surface={f.surface} />
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{f.name}</span>
                <span className="mono" style={{ fontSize: 11, color: '#9c978d', marginLeft: 'auto' }}>
                  {rows.length} {rows.length === 1 ? 'tool' : 'tools'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rows.map((tool) => (
                  <Row key={tool.name} tool={tool} open={!!open[tool.name]} onToggle={() => setOpen((o) => ({ ...o, [tool.name]: !o[tool.name] }))} />
                ))}
              </div>
            </div>
          );
        })}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: '1px solid #E6E1D8', borderRadius: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>No tools match “{query}”</div>
          <div style={{ fontSize: 14, color: '#6f6a60', marginBottom: 18 }}>Try a different term, or clear the filter.</div>
          <button
            onClick={() => { setQuery(''); setFamily('all'); }}
            style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', background: '#2C5E4A', border: 'none', borderRadius: 99, padding: '10px 18px', cursor: 'pointer' }}
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}

function SurfacePill({ surface }: { surface: Surface }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#2C5E4A',
        fontWeight: 600,
        background: '#F4F7F4',
        border: '1px solid #DCEAE2',
        borderRadius: 5,
        padding: '3px 7px',
      }}
    >
      {surface}
    </span>
  );
}

function Row({ tool, open, onToggle }: { tool: (typeof TOOLS)[number]; open: boolean; onToggle: () => void }) {
  const sign = tool.kind === 'write';
  return (
    <div style={{ background: '#fff', border: '1px solid #E6E1D8', borderRadius: 11, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 15px' }}
      >
        <span className="mono" style={{ fontSize: 13.5, fontWeight: 500, color: '#1A1714', flex: 'none' }}>{tool.name}</span>
        <span
          className="mono"
          style={{
            fontSize: 9.5,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 99,
            flex: 'none',
            color: sign ? '#2C5E4A' : '#615c53',
            background: sign ? '#F4F7F4' : '#FAFAF7',
            border: `1px solid ${sign ? '#DCEAE2' : '#E6E1D8'}`,
          }}
        >
          {sign ? 'you sign' : 'read'}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#6f6a60', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.desc}</span>
        <span style={{ fontSize: 10, color: '#b0aa9f', flex: 'none', transition: 'transform .2s', transform: open ? 'none' : 'rotate(-90deg)' }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: '2px 15px 15px', borderTop: '1px solid #EDE9E0' }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#3c3933', margin: '12px 0 14px' }}>{tool.desc}</div>
          <div className="twocol" style={{ gap: 12 }}>
            <Field label="Inputs" value={tool.inputs} color="#1A1714" />
            <Field label="Returns" value={tool.returns} color="#2C5E4A" />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #EDE9E0', borderRadius: 9, padding: '11px 13px' }}>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#928d83', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: 12.5, color }}>{value}</div>
    </div>
  );
}
