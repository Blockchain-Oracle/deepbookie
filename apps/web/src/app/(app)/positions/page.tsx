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
          <PositionsTable positions={data.positions?.minted ?? []} managerId={data.managerId} />
        </div>
      )}
    </Page>
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
