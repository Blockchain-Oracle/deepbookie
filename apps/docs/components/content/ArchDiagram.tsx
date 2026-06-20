/** The one-registry → four-surfaces → unsigned → sign-at-edge diagram. */
export function ArchDiagram() {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E6E1D8',
        borderRadius: 16,
        padding: '26px 22px',
        margin: '18px 0',
        overflowX: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 14, minWidth: 680 }}>
        {/* registry */}
        <div
          style={{
            flex: 'none',
            width: 150,
            background: '#1A1714',
            color: '#F4F2EC',
            borderRadius: 12,
            padding: '16px 15px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7d8a82', fontWeight: 600, marginBottom: 8 }}>
            One registry
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>44 tools</div>
          <div style={{ fontSize: 11.5, color: '#a8a298', lineHeight: 1.4 }}>authored once · Predict + Spot</div>
        </div>

        <Arrow />

        {/* surfaces */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', minWidth: 150 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#928d83', fontWeight: 600, marginBottom: 1 }}>
            Four surfaces
          </div>
          {['Web app', 'MCP server', 'CLI', 'Claude skill'].map((s) => (
            <div key={s} style={{ background: '#FAFAF7', border: '1px solid #E6E1D8', borderRadius: 8, padding: '8px 11px', fontSize: 13, fontWeight: 600 }}>
              {s}
            </div>
          ))}
        </div>

        <Arrow />

        {/* unsigned */}
        <div style={{ flex: 'none', width: 130, background: '#fff', border: '1px dashed #B0856B', borderRadius: 12, padding: '14px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0856B', fontWeight: 600, marginBottom: 6 }}>
            Proposed
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>Unsigned tx</div>
          <div style={{ fontSize: 11.5, color: '#8a857b', lineHeight: 1.4, marginTop: 3 }}>the agent holds no key</div>
        </div>

        <Arrow green />

        {/* sign at edge */}
        <div style={{ flex: 'none', width: 140, background: '#F4F7F4', border: '1px solid #2C5E4A', borderRadius: 12, padding: '14px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -9, right: 11, width: 38, height: 38, border: '1.4px solid #2C5E4A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-9deg)', background: '#F4F7F4' }}>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="#2C5E4A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2C5E4A', fontWeight: 600, marginBottom: 6 }}>
            Sign at the edge
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: '#234' }}>You sign</div>
          <div style={{ fontSize: 11.5, color: '#4a5a52', lineHeight: 1.4, marginTop: 3 }}>wallet, or local key</div>
        </div>
      </div>
    </div>
  );
}

function Arrow({ green }: { green?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', color: green ? '#2C5E4A' : '#c2bdb2', fontSize: 18, fontWeight: green ? 700 : 400 }}>
      →
    </div>
  );
}
