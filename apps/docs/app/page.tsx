import Link from 'next/link';
import { HeroReceipt } from '@/components/home/HeroReceipt';
import { IntentGrid } from '@/components/home/IntentGrid';
import { TradeStrip } from '@/components/home/TradeStrip';
import { PageLayout } from '@/components/shell/PageLayout';
import { APP_URL } from '@/lib/nav';

export default function HomePage() {
  return (
    <PageLayout wide>
      <div className="rise">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: '#2C5E4A',
            fontWeight: 600,
          }}
        >
          DeepBookie Docs
        </span>
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: '#8a857b',
            border: '1px solid #d3cec3',
            borderRadius: 99,
            padding: '3px 9px',
          }}
        >
          Sui testnet
        </span>
      </div>

      <div className="twocol" style={{ alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h1
            style={{
              margin: '0 0 14px',
              fontSize: 54,
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              textWrap: 'balance',
            }}
          >
            Trade DeepBook
            <br />
            just by
            <br />
            <span style={{ color: '#2C5E4A' }}>chatting.</span>
          </h1>
          <p
            style={{
              margin: '0 0 26px',
              fontSize: 17,
              lineHeight: 1.6,
              color: '#615c53',
              maxWidth: 440,
            }}
          >
            DeepBookie is a chat app for trading DeepBook on Sui — two markets, one chat:{' '}
            <b>Predict</b> (yes/no BTC bets) and <b>Spot</b> (the order book). Describe a trade in
            plain English; DeepBookie builds it and you sign in your own wallet.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href={APP_URL}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: '#2C5E4A',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 600,
                padding: '13px 20px',
                borderRadius: 99,
              }}
            >
              Launch app →
            </a>
            <Link
              href="/get-started/introduction"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#fff',
                border: '1px solid #E6E1D8',
                color: '#1A1714',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 600,
                padding: '13px 20px',
                borderRadius: 99,
              }}
            >
              Read the docs
            </Link>
          </div>
        </div>
        <HeroReceipt />
      </div>

      <IntentGrid />
      <TradeStrip />

      <div
        style={{
          marginTop: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#8a857b',
          fontSize: 13,
          flexWrap: 'wrap',
        }}
      >
        <span>Built on</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#4DA2FF' }}>DeepBook</span>
        <span>· Sui testnet · you sign every trade</span>
      </div>
      </div>
    </PageLayout>
  );
}
