/** The signed hero receipt — wax-seal stamp, green top-rule, digest strip. */
export function HeroReceipt() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #C9D8CF',
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          width: 340,
          boxShadow: '0 28px 64px -26px rgba(26,23,20,.4)',
        }}
      >
        <div style={{ height: 3, background: '#2C5E4A' }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '13px 16px',
            borderBottom: '1px solid #EDE9E0',
          }}
        >
          <div>
            <div className="lbl" style={{ color: '#2C5E4A' }}>
              Trade confirmation
            </div>
            <div style={{ fontSize: 12, color: '#8a857b', marginTop: 3 }}>
              Signed · today 3:18 PM
            </div>
          </div>
          <span className="mono" style={{ fontSize: 10, color: '#9c978d' }}>
            DB·7F3A·0112
          </span>
        </div>

        <Stamp />

        <div style={{ padding: '15px 16px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 9 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#2C5E4A',
                border: '1.3px solid #2C5E4A',
                borderRadius: 5,
                padding: '2px 8px',
              }}
            >
              UP ↑
            </span>
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>
              BTC above $63,000
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#8a857b', marginBottom: 14 }}>
            Binary · active until expiry
          </div>
          {[
            ['Quantity', '100.00 contracts'],
            ['Entry probability', '53.8%'],
            ['Paid', '54.07 dUSDC'],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}
            >
              <span style={{ color: '#7d7870' }}>{k}</span>
              <span className="tnum" style={{ fontWeight: 500 }}>
                {v}
              </span>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0 6px',
              fontSize: 13,
              borderTop: '1px solid #EDE9E0',
              marginTop: 4,
            }}
          >
            <span style={{ fontWeight: 700 }}>Max payout if right</span>
            <span className="tnum" style={{ fontWeight: 700, color: '#2C5E4A' }}>
              100.00 dUSDC
            </span>
          </div>
        </div>
        <div
          style={{
            margin: '6px 16px 16px',
            background: '#FAFAF7',
            border: '1px solid #EDE9E0',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span className="mono" style={{ fontSize: 11, color: '#43403a' }}>
            0x9c2a4f…b71f10b
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#2C5E4A', borderBottom: '1.3px solid #2C5E4A' }}>
            Suiscan ↗
          </span>
        </div>
      </div>
    </div>
  );
}

function Stamp() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 52,
        right: 16,
        width: 62,
        height: 62,
        border: '1.4px solid #2C5E4A',
        borderRadius: '50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'rotate(-9deg)',
        opacity: 0.92,
        background: 'rgba(255,255,255,.6)',
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path
          d="M5 12.5l4.5 4.5L19 7"
          fill="none"
          stroke="#2C5E4A"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="mono"
        style={{ fontSize: 6.5, letterSpacing: '0.12em', color: '#2C5E4A', fontWeight: 600, marginTop: 2 }}
      >
        SIGNED
      </span>
    </div>
  );
}
