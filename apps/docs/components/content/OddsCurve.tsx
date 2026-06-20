/** The N(d2) probability curve — the same shape the odds-curve widget draws. */
export function OddsCurve() {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E6E1D8',
        borderRadius: 14,
        padding: '16px 16px 13px',
        margin: '18px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1A1714', color: '#F4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>₿</div>
          <span style={{ fontSize: 15, fontWeight: 700 }}>BTC</span>
          <span className="mono" style={{ fontSize: 13, color: '#8a857b' }}>$69,180</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="livedot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#2C5E4A' }} />
          <span className="mono" style={{ fontSize: 11, color: '#2C5E4A', fontWeight: 500 }}>N(d₂) · P(up)</span>
        </div>
      </div>
      <svg viewBox="0 0 700 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <text x="6" y="14" className="mono" style={{ fontSize: 11, fill: '#c2bdb2' }}>100</text>
        <text x="14" y="62" className="mono" style={{ fontSize: 11, fill: '#c2bdb2' }}>75</text>
        <text x="14" y="114" className="mono" style={{ fontSize: 11, fill: '#c2bdb2' }}>50</text>
        <text x="14" y="166" className="mono" style={{ fontSize: 11, fill: '#c2bdb2' }}>25</text>
        <text x="20" y="206" className="mono" style={{ fontSize: 11, fill: '#c2bdb2' }}>0</text>
        <line x1="44" y1="10" x2="694" y2="10" stroke="#F0ECE3" />
        <line x1="44" y1="62" x2="694" y2="62" stroke="#F0ECE3" />
        <line x1="44" y1="114" x2="694" y2="114" stroke="#F0ECE3" />
        <line x1="44" y1="166" x2="694" y2="166" stroke="#F0ECE3" />
        <line x1="44" y1="204" x2="694" y2="204" stroke="#E4DFD5" />
        <defs>
          <linearGradient id="ocp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2C5E4A" stopOpacity="0.13" />
            <stop offset="1" stopColor="#2C5E4A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M44,40 C160,58 230,74 300,92 C360,108 400,120 430,128 C470,138 500,146 540,158 C600,176 650,188 694,196 L694,204 L44,204 Z" fill="url(#ocp)" />
        <path d="M44,40 C160,58 230,74 300,92 C360,108 400,120 430,128 C470,138 500,146 540,158 C600,176 650,188 694,196" fill="none" stroke="#2C5E4A" strokeWidth="2.4" />
        <line x1="430" y1="10" x2="430" y2="204" stroke="#1A1714" strokeWidth="1" />
        <circle cx="430" cy="128" r="6" fill="#fff" stroke="#2C5E4A" strokeWidth="2.6" />
        <text x="438" y="24" className="mono" style={{ fontSize: 11, fill: '#1A1714', fontWeight: 600 }}>$70,000</text>
      </svg>
      <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#b0aa9f', padding: '3px 0 0 44px' }}>
        <span>$66k</span><span>$68k</span><span>$70k</span><span>$72k</span><span>$74k</span>
      </div>
    </div>
  );
}
