'use client';

import { OddsCurveCard } from '@/components/widgets/OddsCurveCard';
import { SignReceipt, type ReceiptState } from '@/components/widgets/SignReceipt';
import type { Odds } from '@/lib/bff/types';

// Dev-only gallery for visual QA of the hero widgets against the design (no wallet needed).
const SPOT = 63422.99;
const mockOdds: Odds = {
  oracleId: '0xmock',
  expiry: Date.now() + 27 * 60_000,
  spot: SPOT,
  forward: SPOT + 30,
  atmProbabilityUp: 0.5,
  curve: Array.from({ length: 25 }, (_, i) => {
    const strike = 60000 + i * 250;
    return { strike, probabilityUp: 1 / (1 + Math.exp((strike - SPOT) / 700)) };
  }),
};

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

export default function WidgetGallery() {
  const receiptStates: ReceiptState[] = ['loading', 'proposed', 'signing', 'signed', 'failed', 'cancelled'];
  return (
    <main className="min-h-screen bg-canvas px-12 py-14 font-sans text-ink">
      <h1 className="mb-1 text-2xl font-bold tracking-[-0.03em]">Widget gallery</h1>
      <p className="mb-10 text-sm text-muted">Dev-only visual QA against the design system.</p>

      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.1em] text-faint">⭐ Odds curve</h2>
      <div className="mb-14 flex flex-wrap gap-8">
        <Cell label="live"><OddsCurveCard status="live" odds={mockOdds} onBet={() => {}} /></Cell>
        <Cell label="settled"><OddsCurveCard status="live" odds={mockOdds} settled /></Cell>
        <Cell label="loading"><OddsCurveCard status="loading" /></Cell>
        <Cell label="empty"><OddsCurveCard status="empty" /></Cell>
        <Cell label="error"><OddsCurveCard status="error" /></Cell>
      </div>

      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.1em] text-faint">⭐ Sign receipt</h2>
      <div className="flex flex-wrap gap-8">
        {receiptStates.map((s) => (
          <Cell key={s} label={s}>
            <SignReceipt state={s} {...receiptBase} onAuthorize={() => {}} onCancel={() => {}} onRetry={() => {}} onDismiss={() => {}} />
          </Cell>
        ))}
      </div>
    </main>
  );
}
