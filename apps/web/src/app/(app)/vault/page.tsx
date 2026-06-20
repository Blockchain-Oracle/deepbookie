'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Page, PageHeader } from '@/components/shell/Page';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { VaultPoolCard } from '@/components/widgets/VaultPoolCard';
import { VaultManage } from '@/components/widgets/VaultManage';
import { useVault, useVaultHistory } from '@/lib/hooks/useVault';
import { usePlp } from '@/lib/hooks/usePlp';

/** Liquidity vault — public pool stats on the left, the connected wallet's supply/withdraw on the right. */
export default function VaultPage() {
  const account = useCurrentAccount();
  const vault = useVault();
  const history = useVaultHistory();
  const plp = usePlp();

  return (
    <Page>
      <PageHeader
        title="Liquidity vault"
        subtitle="Provide liquidity to the PLP pool · earn the maker spread"
      />

      {vault.isLoading && !vault.data ? (
        <Skeleton className="h-96 w-full" />
      ) : vault.isError || !vault.data ? (
        <Card className="p-6 text-center text-sm text-muted">
          Couldn’t load the vault right now — try again in a moment.
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <VaultPoolCard vault={vault.data} history={history.data} />
          {account ? <VaultManage vault={vault.data} plp={plp.data} /> : <ConnectPrompt />}
        </div>
      )}
    </Page>
  );
}

function ConnectPrompt() {
  return (
    <Card className="flex flex-col items-start gap-3 p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Your position</div>
      <p className="text-sm text-muted">Connect a Sui wallet to supply liquidity and earn the maker spread.</p>
      <ConnectButton />
    </Card>
  );
}
