'use client';

import Link from 'next/link';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Page, PageHeader } from '@/components/shell/Page';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConnectScreen } from '@/components/onboarding/ConnectScreen';
import { PortfolioRollup } from '@/components/widgets/PortfolioRollup';
import { PositionsTable } from '@/components/widgets/PositionsTable';
import { usePositions } from '@/lib/hooks/usePositions';

/** Positions & PnL — resolves the wallet's shared manager, then rolls up portfolio + open positions. */
export default function PositionsPage() {
  const account = useCurrentAccount();
  const { data, isLoading, isError } = usePositions(account?.address);

  if (!account) {
    return (
      <Page>
        <ConnectScreen />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title="Positions" subtitle="Your live exposure and settled results · testnet" />

      {isLoading && !data ? (
        <div className="flex flex-col gap-5">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : isError ? (
        <Card className="p-6 text-center text-sm text-muted">
          Couldn’t load your positions right now — try again in a moment.
        </Card>
      ) : !data?.managerId ? (
        <NoAccount />
      ) : (
        <div className="flex flex-col gap-5">
          {data.portfolio && <PortfolioRollup portfolio={data.portfolio} />}
          <PositionsTable positions={data.positions?.open ?? []} managerId={data.managerId} />
          <LifecycleNote />
        </div>
      )}
    </Page>
  );
}

/** How a Predict bet behaves end-to-end — so "ongoing", "sell now", and "collect" are never a mystery. */
function LifecycleNote() {
  const steps = [
    { k: 'Bet', d: 'You mint an UP/DOWN position — you sign it; dUSDC leaves your wallet.' },
    { k: 'Ongoing', d: 'Its value moves with the live odds until the deadline.' },
    { k: 'Settles', d: 'At expiry the oracle stamps the price — the outcome locks automatically.' },
    { k: 'Collect', d: 'Redeem a settled win for its payout (a lost bet is worth 0).' },
  ];
  return (
    <Card className="p-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">How a bet works</div>
      <div className="flex flex-col gap-2">
        {steps.map((s) => (
          <div key={s.k} className="flex gap-3 text-[13px] leading-snug">
            <span className="w-16 shrink-0 font-semibold text-ink">{s.k}</span>
            <span className="text-muted">{s.d}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-snug text-muted">
        No “cancel” — Predict is a vault, not an order book. But you’re never trapped: <span className="font-semibold text-ink">Sell now</span> closes an open bet early at its live value.
      </p>
    </Card>
  );
}

function NoAccount() {
  return (
    <Card className="p-10 text-center">
      <div className="text-[15px] font-semibold">No account yet</div>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        Your DeepBook Predict account is created the first time you place a bet — the agent proposes
        it, you sign it.
      </p>
      <Link
        href="/chat"
        className="mt-5 inline-flex rounded-card-in bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90"
      >
        Place your first bet →
      </Link>
    </Card>
  );
}
