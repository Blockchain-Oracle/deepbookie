'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Result = { url: string; title: string; excerpt: string };

// Pagefind is generated at build time into /public/_pagefind. Loaded lazily.
type Pagefind = {
  search: (q: string) => Promise<{ results: { data: () => Promise<RawData> }[] }>;
};
type RawData = { url: string; meta?: { title?: string }; excerpt?: string };

function cleanUrl(url: string): string {
  const u = url.replace(/\.html$/, '').replace(/\/index$/, '');
  return u === '' ? '/' : u;
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [ready, setReady] = useState(true);
  const pf = useRef<Pagefind | null>(null);
  const router = useRouter();

  // lazy-load pagefind on first open
  useEffect(() => {
    if (!open || pf.current) return;
    (async () => {
      try {
        // @ts-expect-error — runtime path served from /public, not bundled
        pf.current = await import(/* webpackIgnore: true */ '/_pagefind/pagefind.js');
      } catch {
        setReady(false);
      }
    })();
  }, [open]);

  // debounced search
  useEffect(() => {
    if (!q.trim() || !pf.current) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const search = await pf.current!.search(q);
        const data = await Promise.all(search.results.slice(0, 12).map((r) => r.data()));
        setResults(
          data
            .map((d) => ({
              url: cleanUrl(d.url),
              title: d.meta?.title ?? cleanUrl(d.url),
              excerpt: (d.excerpt ?? '').replace(/<\/?mark>/g, ''),
            }))
            .filter((r) => !r.url.startsWith('/_'))
            .slice(0, 8),
        );
      } catch {
        setResults([]);
      }
    }, 140);
    return () => clearTimeout(id);
  }, [q]);

  if (!open) return null;

  const go = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '14vh 20px 20px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(26,23,20,.4)', backdropFilter: 'blur(3px)' }} />
      <div className="rise" style={{ position: 'relative', width: '100%', maxWidth: 580, background: '#fff', border: '1px solid #E6E1D8', borderRadius: 16, boxShadow: '0 28px 64px -26px rgba(26,23,20,.55)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 18px', borderBottom: '1px solid #EDE9E0' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#928d83" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search docs…" className="mono" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#1A1714', background: 'none' }} />
          <span className="mono" style={{ fontSize: 10, color: '#928d83', border: '1px solid #E6E1D8', borderRadius: 5, padding: '3px 7px' }}>esc</span>
        </div>

        <div style={{ maxHeight: '54vh', overflowY: 'auto', padding: 8 }}>
          {results.length > 0 ? (
            results.map((r) => (
              <button key={r.url} onClick={() => go(r.url)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', textDecoration: 'none', padding: '11px 12px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
                <span style={{ width: 30, height: 30, flex: 'none', borderRadius: 8, background: '#F4F7F4', border: '1px solid #DCEAE2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2C5E4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2.5h8l5 5V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" />
                    <path d="M14 2.5V8h5" />
                  </svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1A1714' }}>{r.title}</span>
                  <span className="mono" style={{ display: 'block', fontSize: 11, color: '#928d83', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</span>
                </span>
                <span style={{ fontSize: 13, color: '#b0aa9f' }}>↵</span>
              </button>
            ))
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#3c3933', marginBottom: 6 }}>
                {q ? `No results for “${q}”` : ready ? 'Search the docs' : 'Search builds with the site'}
              </div>
              <div style={{ fontSize: 13, color: '#928d83' }}>Try “odds”, “sign”, “MCP”, or a tool name.</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 18px', borderTop: '1px solid #EDE9E0', background: '#FAFAF7' }}>
          {['↵ open', 'esc close'].map((k) => (
            <span key={k} className="mono" style={{ fontSize: 10.5, color: '#928d83' }}>{k}</span>
          ))}
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10.5, color: '#b0aa9f' }}>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
