import Link from 'next/link';
import type { ReactNode } from 'react';
import { APP_URL } from '@/lib/nav';

const svg = (children: ReactNode) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#2C5E4A"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

type Card = {
  icon: ReactNode;
  tag: string;
  title: string;
  blurb: string;
  cta: string;
  href: string;
  external?: boolean;
};

const CARDS: Card[] = [
  {
    icon: svg(<><rect x="6" y="2.5" width="12" height="19" rx="3" /><path d="M10 18.5h4" /></>),
    tag: 'web',
    title: 'Try the web app',
    blurb: 'Connect a wallet, fund test dUSDC, and place your first signed bet.',
    cta: 'Open the app',
    href: APP_URL,
    external: true,
  },
  {
    icon: svg(<path d="M12 3v18M3 7.5l9 5 9-5M3 16.5l9-5" />),
    tag: 'mcp',
    title: 'MCP server',
    blurb: 'Run the tools inside Claude Desktop, Cursor, or Claude Code.',
    cta: 'Install MCP',
    href: '/surfaces/mcp',
  },
  {
    icon: svg(<><rect x="2.5" y="4" width="19" height="16" rx="2.5" /><path d="M6 9l3 3-3 3M12 15h5" /></>),
    tag: 'cli',
    title: 'CLI',
    blurb: 'A first read and a first signed write, straight from the terminal.',
    cta: 'Get the CLI',
    href: '/surfaces/cli',
  },
  {
    icon: svg(<path d="M8 4l-5 8 5 8M16 4l5 8-5 8" />),
    tag: 'npm',
    title: '@deepbookie/predict-client',
    blurb: 'Read odds and build an unsigned mint PTB in your own app.',
    cta: 'Use the SDK',
    href: '/sdk/predict-client',
  },
  {
    icon: svg(<path d="M14 6a3.5 3.5 0 0 1 4.9 4.9l-9 9-4.9.9.9-4.9 9-9Z" />),
    tag: '44 tools',
    title: 'Tool reference',
    blurb: 'Every tool across Predict and Spot, with inputs and returns.',
    cta: 'Browse tools',
    href: '/tools',
  },
  {
    icon: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
    tag: 'concept',
    title: 'How it works',
    blurb: 'The architecture, the pricing model, and the sign-at-edge trust.',
    cta: 'Read concepts',
    href: '/concepts/architecture',
  },
];

export function IntentGrid() {
  return (
    <>
      <div style={{ marginTop: 44, marginBottom: 14 }}>
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#928d83',
            fontWeight: 600,
          }}
        >
          Start where you are
        </div>
      </div>
      <div className="intent-grid">
        {CARDS.map((c) => {
          const inner = (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: '#F4F7F4',
                    border: '1px solid #DCEAE2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {c.icon}
                </div>
                <span className="mono" style={{ fontSize: 10, color: '#9c978d' }}>
                  {c.tag}
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 5 }}>
                {c.title}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5, color: '#6f6a60' }}>{c.blurb}</div>
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: '#2C5E4A' }}>
                {c.cta} →
              </div>
            </>
          );
          const style = {
            display: 'block',
            textDecoration: 'none',
            color: '#1A1714',
            background: '#fff',
            border: '1px solid #E6E1D8',
            borderRadius: 14,
            padding: 20,
          } as const;
          return c.external ? (
            <a key={c.title} className="intent-card" href={c.href} style={style}>
              {inner}
            </a>
          ) : (
            <Link key={c.title} className="intent-card" href={c.href} style={style}>
              {inner}
            </Link>
          );
        })}
      </div>
    </>
  );
}
