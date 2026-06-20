'use client';

import { OddsCurveCard } from '@/components/widgets/OddsCurveCard';
import { SignReceipt, type ReceiptState } from '@/components/widgets/SignReceipt';
import { MarketHeader } from '@/components/widgets/MarketHeader';
import { MarketTable } from '@/components/widgets/MarketTable';
import { QuotePreview } from '@/components/widgets/QuotePreview';
import { RangePayoff } from '@/components/widgets/RangePayoff';
import { VaultCard } from '@/components/widgets/VaultCard';
import { PortfolioRollup } from '@/components/widgets/PortfolioRollup';
import { PositionCard } from '@/components/widgets/PositionCard';
import { ActivityTape } from '@/components/widgets/ActivityTape';
import type { Market, MarketState, Odds, Portfolio, Position, Quote, RangeQuote, Vault } from '@/lib/bff/types';

// Dev-only gallery for visual QA of every widget against the design (no wallet needed).
const SPOT = 63422.99;
const EXPIRY = Date.now() + 27 * 60_000;

const mockOdds: Odds = {
  oracleId: '0xmock',
  expiry: EXPIRY,
  spot: SPOT,
  forward: SPOT + 30,
  atmProbabilityUp: 0.5,
  curve: Array.from({ length: 25 }, (_, i) => {
    const strike = 60000 + i * 250;
    return { strike, probabilityUp: 1 / (1 + Math.exp((strike - SPOT) / 700)) };
  }),
};
const mockMarket: MarketState = { oracleId: '0x', asset: 'BTC', expiry: EXPIRY, status: 'active', spot: SPOT, forward: SPOT + 30, minStrike: 50000, tickSize: 1 };
const mockQuote: Quote = { requestedStrikeUsd: 63000, strikeUsd: 63000, quantityUsd: 100, mintCostUsd: 54.07, redeemPayoutUsd: 45.9, askProbability: 0.538 };
const mockRange: RangeQuote = { lowerStrikeUsd: 62000, higherStrikeUsd: 64000, quantityUsd: 100, mintCostUsd: 40, redeemPayoutUsd: 60 };
const mockVault: Vault = { vaultValueUsd: 1284910, availableLiquidityUsd: 488266, totalMaxPayoutUsd: 200000, plpSharePrice: 1.0021, utilization: 0.62 };
const mockPortfolio: Portfolio = { managerId: '0x', accountValueUsd: 458.33, tradingBalanceUsd: 300, openExposureUsd: 158, redeemableValueUsd: 0, realizedPnlUsd: 46.05, unrealizedPnlUsd: 12.4, openPositions: 2, currentTotalPnlUsd: 58.45 };
const mockPosition: Position = { oracleId: '0x', expiry: EXPIRY, strikeUsd: 63000, direction: 'UP', quantityUsd: 100, costUsd: 53.8, probabilityAtTrade: 0.538, digest: '0xabc', at: Date.now() };
const mockMarkets: Market[] = [
  { oracleId: '0x1', asset: 'BTC', expiry: EXPIRY, minStrike: 50000, tickSize: 1, status: 'active' },
  { oracleId: '0x2', asset: 'BTC', expiry: EXPIRY + 36e5, minStrike: 50000, tickSize: 1, status: 'active' },
  { oracleId: '0x3', asset: 'BTC', expiry: EXPIRY - 36e5, minStrike: 50000, tickSize: 1, status: 'settled' },
];
const mockBets: Position[] = [mockPosition, { ...mockPosition, direction: 'DOWN', strikeUsd: 62500, quantityUsd: 50, costUsd: 22 }];

const receiptBase = {
  title: 'BTC above $63,000',
  direction: 'UP' as const,
  quantity: 100,
  costUsd: 54.07,
  maxPayoutUsd: 100,
  docNumber: 'DB·7F3A·0112',
  settleNote: 'Binary · settles in 27 minutes',
  signedAt: '3:18 PM',
  digest: '0x9c2a4ff1b71f10b',
  suiscanUrl: '#',
  reason: 'The transaction was rejected in your wallet. No funds moved.',
};

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-[340px]">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">{label}</div>
      {children}
    </div>
  );
}
function Section({ title }: { title: string }) {
  return <h2 className="mb-4 mt-12 font-mono text-xs uppercase tracking-[0.1em] text-faint">{title}</h2>;
}

export default function WidgetGallery() {
  const receiptStates: ReceiptState[] = ['loading', 'proposed', 'signing', 'signed', 'failed', 'cancelled'];
  return (
    <main className="min-h-screen bg-canvas px-12 py-14 font-sans text-ink">
      <h1 className="mb-1 text-2xl font-bold tracking-[-0.03em]">Widget gallery</h1>
      <p className="text-sm text-muted">Dev-only visual QA against the design system.</p>

      <Section title="⭐ Odds curve" />
      <div className="flex flex-wrap gap-8">
        <Cell label="live"><OddsCurveCard status="live" odds={mockOdds} onBet={() => {}} /></Cell>
        <Cell label="settled"><OddsCurveCard status="live" odds={mockOdds} settled /></Cell>
        <Cell label="loading"><OddsCurveCard status="loading" /></Cell>
        <Cell label="empty"><OddsCurveCard status="empty" /></Cell>
        <Cell label="error"><OddsCurveCard status="error" /></Cell>
      </div>

      <Section title="⭐ Sign receipt" />
      <div className="flex flex-wrap gap-8">
        {receiptStates.map((s) => (
          <Cell key={s} label={s}>
            <SignReceipt state={s} {...receiptBase} onAuthorize={() => {}} onCancel={() => {}} onRetry={() => {}} onDismiss={() => {}} />
          </Cell>
        ))}
      </div>

      <Section title="Read widgets" />
      <div className="flex flex-wrap gap-8">
        <Cell label="market header"><MarketHeader market={mockMarket} /></Cell>
        <Cell label="quote preview"><QuotePreview quote={mockQuote} /></Cell>
        <Cell label="range payoff"><RangePayoff quote={mockRange} /></Cell>
        <Cell label="vault"><VaultCard vault={mockVault} /></Cell>
        <Cell label="portfolio rollup"><PortfolioRollup portfolio={mockPortfolio} /></Cell>
        <Cell label="position"><PositionCard position={mockPosition} /></Cell>
        <Cell label="activity tape"><ActivityTape bets={mockBets} /></Cell>
        <Cell label="markets table"><MarketTable markets={mockMarkets} onPick={() => {}} /></Cell>
      </div>
    </main>
  );
}
