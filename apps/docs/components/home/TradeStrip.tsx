import Link from 'next/link';

const STEPS = [
  {
    n: 1,
    kicker: 'You ask',
    title: 'Say it in plain language',
    body: '“Bet $50 that BTC is above $70k Friday.” No forms, no order tickets.',
  },
  {
    n: 2,
    kicker: 'It prices',
    title: 'Priced off a live model',
    body: 'An SVI volatility smile gives the no-arbitrage probability and cost.',
  },
  {
    n: 3,
    kicker: 'It proposes',
    title: 'An unsigned receipt',
    body: 'A confirmation you can read line by line — and an unsigned transaction.',
  },
  {
    n: 4,
    kicker: 'You sign',
    title: 'Your wallet, your key',
    body: 'Approve it. The wax seal stamps in; a digest links to Suiscan.',
  },
];

export function TradeStrip() {
  return (
    <div
      style={{
        marginTop: 44,
        background: '#F4F2EC',
        border: '1px solid #DED9CF',
        borderRadius: 16,
        padding: '26px 26px 28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#928d83',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            How a trade works
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Propose → sign → receipt, in four steps
          </div>
        </div>
        <Link
          href="/get-started/how-it-works"
          style={{ fontSize: 13.5, fontWeight: 600, color: '#2C5E4A', textDecoration: 'none' }}
        >
          See it live →
        </Link>
      </div>
      <div className="trade-strip">
        {STEPS.map((s) => (
          <div
            key={s.n}
            style={{ background: '#fff', border: '1px solid #E6E1D8', borderRadius: 12, padding: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <span
                className="mono"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#1A1714',
                  color: '#F4F2EC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {s.n}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#2C5E4A',
                  fontWeight: 600,
                }}
              >
                {s.kicker}
              </span>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#6f6a60' }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
