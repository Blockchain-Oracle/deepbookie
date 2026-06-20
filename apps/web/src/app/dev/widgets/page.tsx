'use client';

import { Providers } from '@/components/providers/Providers';
import { SpotPoolTable } from '@/components/widgets/spot/SpotPoolTable';
import { OrderbookDepth } from '@/components/widgets/spot/OrderbookDepth';
import { OpenOrdersList } from '@/components/widgets/spot/OpenOrdersList';
import { OrderValidityHint } from '@/components/widgets/spot/OrderValidityHint';
import { SpotFacts } from '@/components/widgets/spot/SpotFacts';
import { SwapCard } from '@/components/widgets/spot/SwapCard';
import { LimitOrderTicket } from '@/components/widgets/spot/LimitOrderTicket';
import { StakeCard } from '@/components/widgets/spot/StakeCard';
import { GovernanceCard } from '@/components/widgets/spot/GovernanceCard';
import { ModifyOrderCard } from '@/components/widgets/spot/ModifyOrderCard';
import { SettledSweepCard } from '@/components/widgets/spot/SettledSweepCard';
import { BalanceManagerPanel } from '@/components/widgets/spot/BalanceManagerPanel';
import type { WriteToolPart } from '@/components/widgets/ReceiptController';
import type { SpotOpenOrder, SpotOrderbook, SpotPool } from '@/lib/bff/spot-types';
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
import { Markdown } from '@/components/chat/Markdown';
import { MessageList } from '@/components/chat/MessageList';
import type { Market, MarketState, Odds, Portfolio, Position, Quote, RangeQuote, Vault } from '@/lib/bff/types';

const MOCK_MD = `Here's the **BTC binary** settling at 2:30 PM.

- Spot: \`$63,422.99\`
- Model P(up) at $63k: **53.8%**
- Breakeven: ~$63,180

| Side | Cost / 100 | Max payout |
| --- | --- | --- |
| UP | 53.80 | 100.00 |
| DOWN | 46.20 | 100.00 |

I'd lean **UP** here — want me to price a bet? See [Suiscan](https://suiscan.xyz/testnet).`;

const LONG_USER_MSG =
  'Quote a UP bet on the BTC market settling Jun 20, 2:30 PM at strike $63000. (oracleId: 0x828b28349daf715f8dd43fc9d946ce721a4be6b2e8ac8b1c562b855625fefb5c)';

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

// ── Spot (DeepBook V3) mocks — shapes match the live testnet reads ──
const mockPools: SpotPool[] = [
  { poolKey: 'SUI_DBUSDC', base: 'SUI', quote: 'DBUSDC', poolId: '0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5' },
  { poolKey: 'DEEP_SUI', base: 'DEEP', quote: 'SUI', poolId: '0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f' },
  { poolKey: 'DEEP_DBUSDC', base: 'DEEP', quote: 'DBUSDC', poolId: '0xe86b991f8632217505fd859445f9803967ac84a9d4a1219065bf191fcb74b622' },
];
const mockBook: SpotOrderbook = {
  poolKey: 'SUI_DBUSDC',
  bids: [{ price: 0.698, size: 20 }, { price: 0.695, size: 10 }, { price: 0.6, size: 1.8 }],
  asks: [{ price: 0.706, size: 10 }, { price: 0.709, size: 10 }, { price: 0.71, size: 10 }],
};
const mockOrders: SpotOpenOrder[] = [
  { poolKey: 'SUI_DBUSDC', orderId: '0xorder1aa', isBid: true, price: 0.69, quantity: 100, filledQuantity: 30, status: 'open', expireTs: Date.now() + 36e5 },
  { poolKey: 'SUI_DBUSDC', orderId: '0xorder2bb', isBid: false, price: 0.72, quantity: 50, filledQuantity: 0, status: 'open', expireTs: Date.now() + 72e5 },
];
const noop = () => {};
const writePart = (tool: string, input: Record<string, unknown>): WriteToolPart => ({
  type: `tool-${tool}`,
  input,
  toolCallId: `devmock${tool.slice(-4)}`,
});
const spotWriteProps = { addToolResult: noop, onOutcome: noop, onRetry: noop };

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

export default function WidgetGalleryPage() {
  // Wrap in the app providers (ssr:false) — some widgets (PositionCard) now read on-chain via wallet
  // hooks, so they need the SuiClient/Wallet context; this also keeps the page out of static prerender.
  return (
    <Providers>
      <WidgetGallery />
    </Providers>
  );
}

function WidgetGallery() {
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

      <Section title="Chat formatting" />
      <div className="flex flex-wrap gap-8">
        <Cell label="assistant markdown">
          <Markdown>{MOCK_MD}</Markdown>
        </Cell>
        <Cell label="user bubble (long + oracleId)">
          <div className="ml-auto w-fit max-w-[82%] whitespace-pre-wrap rounded-[16px_16px_5px_16px] bg-ink px-4 py-2.5 text-sm leading-snug text-paper [overflow-wrap:anywhere]">
            {LONG_USER_MSG}
          </div>
        </Cell>
      </div>

      <Section title="Chat home — category carousel" />
      <div className="h-[440px] w-full max-w-[720px] overflow-hidden rounded-card border border-line bg-canvas">
        <MessageList messages={[]} status="ready" addToolResult={() => {}} onAction={() => {}} />
      </div>

      <Section title="⭐ Spot (DeepBook V3) — reads" />
      <div className="flex flex-wrap gap-8">
        <Cell label="pool table"><SpotPoolTable pools={mockPools} onTrade={noop} /></Cell>
        <Cell label="orderbook depth"><OrderbookDepth data={mockBook} /></Cell>
        <Cell label="open orders"><OpenOrdersList orders={mockOrders} /></Cell>
        <Cell label="validity hint">
          <div className="flex flex-col gap-2">
            <OrderValidityHint valid />
            <OrderValidityHint valid={false} />
          </div>
        </Cell>
        <Cell label="spot facts (pool params)">
          <SpotFacts name="spot_pool_params" data={{ poolKey: 'SUI_DBUSDC', takerFee: 0.001, makerFee: 0.0005, stakeRequired: 100, tickSize: 0.001, lotSize: 0.1, minSize: 1, whitelisted: true }} />
        </Cell>
      </div>

      <Section title="⭐ Spot — generative-input writes (proposed)" />
      <div className="flex flex-wrap gap-8">
        <Cell label="swap"><SwapCard part={writePart('spot_swap_base_for_quote', { poolKey: 'SUI_DBUSDC', amount: 10 })} {...spotWriteProps} /></Cell>
        <Cell label="limit order"><LimitOrderTicket part={writePart('spot_place_limit_order', { poolKey: 'SUI_DBUSDC' })} {...spotWriteProps} /></Cell>
        <Cell label="modify order"><ModifyOrderCard part={writePart('spot_modify_order', { poolKey: 'SUI_DBUSDC', orderId: '0xorder1aa', currentQuantity: 100, filledQuantity: 30 })} {...spotWriteProps} /></Cell>
        <Cell label="stake"><StakeCard part={writePart('spot_stake', { poolKey: 'SUI_DBUSDC' })} {...spotWriteProps} /></Cell>
        <Cell label="governance"><GovernanceCard part={writePart('spot_submit_proposal', { poolKey: 'SUI_DBUSDC' })} {...spotWriteProps} /></Cell>
        <Cell label="settled sweep"><SettledSweepCard part={writePart('spot_withdraw_settled_amounts', { poolKey: 'SUI_DBUSDC' })} {...spotWriteProps} /></Cell>
        <Cell label="balance manager"><BalanceManagerPanel onAction={noop} /></Cell>
      </div>
    </main>
  );
}
