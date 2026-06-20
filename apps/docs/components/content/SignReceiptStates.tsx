/** The SignReceipt widget in all six states — the propose→sign→receipt lifecycle. */
export function SignReceiptStates() {
  return (
    <div className="intent-grid" style={{ margin: '18px 0' }}>
      <State n="1" label="Loading" color="#9c978d"><Loading /></State>
      <State n="2" label="Proposed" color="#1A1714"><Proposed /></State>
      <State n="3" label="Signing" color="#1A1714"><Signing /></State>
      <State n="4" label="Signed" color="#2C5E4A"><Signed /></State>
      <State n="5" label="Failed" color="#B0452B"><Failed /></State>
      <State n="6" label="Cancelled · void" color="#B0856B"><Cancelled /></State>
    </div>
  );
}

function State({ n, label, color, children }: { n: string; label: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color, fontWeight: 600, marginBottom: 7 }}>
        {n} · {label}
      </div>
      {children}
    </div>
  );
}

const card = (border: string): React.CSSProperties => ({ background: '#fff', border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden', position: 'relative' });
const head = (state: string, color: string) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid #EDE9E0' }}>
    <div><div className="lbl" style={{ color }}>Trade confirmation</div><div style={{ fontSize: 11.5, color: '#8a857b', marginTop: 2 }}>{state}</div></div>
    <span className="mono" style={{ fontSize: 9.5, color: '#9c978d' }}>DB·7F3A·0112</span>
  </div>
);
const upRow = (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
    <span style={{ fontSize: 10, fontWeight: 700, color: '#2C5E4A', border: '1.2px solid #2C5E4A', borderRadius: 5, padding: '2px 7px' }}>UP ↑</span>
    <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>BTC above $70,000</span>
  </div>
);

function Loading() {
  const bar = (w: string, h: number, bg: string) => <div style={{ width: w, height: h, borderRadius: 4, background: bg, marginBottom: 9 }} />;
  return (
    <div style={card('#E6E1D8')}>
      <div style={{ height: 3, background: '#ECE8DF' }} />
      <div style={{ padding: '14px 15px' }}>{bar('60%', 11, '#ECE8DF')}{bar('80%', 18, '#ECE8DF')}{bar('100%', 10, '#F0ECE3')}{bar('70%', 10, '#F0ECE3')}</div>
    </div>
  );
}

function Proposed() {
  return (
    <div style={card('#1A1714')}>
      <div style={{ height: 3, background: '#1A1714' }} />
      {head('Awaiting signature', '#1A1714')}
      <div style={{ padding: '12px 14px 6px' }}>{upRow}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12.5 }}><span style={{ color: '#7d7870' }}>Total to pay</span><span className="tnum" style={{ fontWeight: 600 }}>50.00 dUSDC</span></div>
      </div>
      <div style={{ padding: '6px 14px 14px', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: '#1A1714', color: '#F4F2EC', textAlign: 'center', fontWeight: 600, fontSize: 13, padding: 9, borderRadius: 8 }}>Sign</div>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 13, padding: 9, borderRadius: 8, border: '1px solid #E2DDD3', color: '#7d7870' }}>Cancel</div>
      </div>
    </div>
  );
}

function Signing() {
  return (
    <div style={card('#1A1714')}>
      <div style={{ height: 3, background: '#1A1714' }} />
      {head('Signing…', '#1A1714')}
      <div style={{ padding: '12px 14px 6px', opacity: 0.55 }}>{upRow}</div>
      <div style={{ padding: '8px 14px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 22, height: 22, border: '2.5px solid #E2DDD3', borderTopColor: '#1A1714', borderRadius: '50%', animation: 'dbkSpin 0.9s linear infinite' }} />
        <span style={{ fontSize: 12.5, color: '#7d7870', fontWeight: 500 }}>Confirm in your wallet…</span>
      </div>
    </div>
  );
}

function Signed() {
  return (
    <div style={card('#C9D8CF')}>
      <div style={{ height: 3, background: '#2C5E4A' }} />
      {head('Signed · just now', '#2C5E4A')}
      <div style={{ position: 'absolute', top: 46, right: 13, width: 54, height: 54, border: '1.4px solid #2C5E4A', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-9deg)', opacity: 0.92, background: 'rgba(255,255,255,.65)' }}>
        <svg viewBox="0 0 24 24" width="17" height="17"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="#2C5E4A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span className="mono" style={{ fontSize: 6, letterSpacing: '0.1em', color: '#2C5E4A', fontWeight: 600, marginTop: 1 }}>SIGNED</span>
      </div>
      <div style={{ padding: '12px 14px 4px' }}>{upRow}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12.5 }}><span style={{ color: '#7d7870' }}>Max payout</span><span className="tnum" style={{ fontWeight: 700, color: '#2C5E4A' }}>100.00 dUSDC</span></div>
      </div>
      <div style={{ margin: '6px 14px 14px', background: '#FAFAF7', border: '1px solid #EDE9E0', borderRadius: 8, padding: '8px 11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10.5, color: '#43403a' }}>0x9c2a…f10b</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#2C5E4A', borderBottom: '1.3px solid #2C5E4A' }}>Suiscan ↗</span>
      </div>
    </div>
  );
}

function Failed() {
  return (
    <div style={card('#E6C9BE')}>
      <div style={{ height: 3, background: '#B0452B' }} />
      {head('Transaction failed', '#B0452B')}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ background: '#FBF1EC', border: '1px solid #E6C9BE', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, lineHeight: 1.45, color: '#8a2f1c', marginBottom: 11 }}>Not enough dUSDC for cost + gas. Nothing was signed.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: '#B0452B', color: '#fff', textAlign: 'center', fontWeight: 600, fontSize: 13, padding: 9, borderRadius: 8 }}>Retry</div>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 13, padding: 9, borderRadius: 8, border: '1px solid #E2DDD3', color: '#7d7870' }}>Dismiss</div>
        </div>
      </div>
    </div>
  );
}

function Cancelled() {
  return (
    <div style={{ background: '#FBFAF7', border: '1px dashed #D8CFC2', borderRadius: 12, overflow: 'hidden', opacity: 0.92 }}>
      <div style={{ height: 0, borderTop: '2px dashed #B0856B' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
        <span className="lbl" style={{ color: '#a8a298' }}>Trade confirmation</span>
        <span className="mono" style={{ fontSize: 9.5, color: '#a8a298', border: '1px solid #E2DDD3', borderRadius: 99, padding: '2px 8px' }}>VOID</span>
      </div>
      <div style={{ padding: '0 14px 6px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#a8a298', border: '1.2px solid #d8cfc2', borderRadius: 5, padding: '2px 7px' }}>UP ↑</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#a8a298', textDecoration: 'line-through', textDecorationColor: '#cabfb0' }}>BTC above $70,000</span>
      </div>
      <div style={{ padding: '8px 14px 16px', fontSize: 12, color: '#a8a298' }}>You declined this proposal — nothing was signed.</div>
    </div>
  );
}
