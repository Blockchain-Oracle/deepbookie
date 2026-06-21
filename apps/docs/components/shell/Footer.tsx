import Link from 'next/link';
import { Mark } from '@/components/brand/Mark';
import { GITHUB_URL, APP_URL } from '@/lib/nav';

const colLabel = {
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#928d83',
  marginBottom: 10,
};
const linkStyle = { color: '#615c53', textDecoration: 'none', fontSize: 13.5 };

export function Footer() {
  return (
    <footer style={{ marginTop: 56, padding: '30px 0 50px', borderTop: '1px solid #DED9CF' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between' }}>
        <div style={{ maxWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Mark size={18} />
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.03em' }}>
              DeepBookie
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: '#8a857b', lineHeight: 1.5 }}>
            Built on DeepBook · Sui testnet. The agent proposes; you sign.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          <div>
            <div className="mono" style={colLabel}>
              Product
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <a href={APP_URL} style={linkStyle}>
                Web app
              </a>
              <a href={GITHUB_URL} style={linkStyle}>
                GitHub
              </a>
            </div>
          </div>
          <div>
            <div className="mono" style={colLabel}>
              Docs
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Link href="/get-started/quickstart-web" style={linkStyle}>
                Quickstart
              </Link>
              <Link href="/tools" style={linkStyle}>
                Tools
              </Link>
              <Link href="/sdk/predict-client" style={linkStyle}>
                SDK
              </Link>
            </div>
          </div>
          <div>
            <div className="mono" style={colLabel}>
              Community
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <a href="https://x.com/deepbookie" style={linkStyle}>
                X / Twitter
              </a>
              <a href="#" style={linkStyle}>
                Discord
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="mono" style={{ fontSize: 11, color: '#9c978d', marginTop: 26 }}>
        © 2026 DeepBookie · testnet build
      </div>
    </footer>
  );
}
