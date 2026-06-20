'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { useBalances } from '@/lib/hooks/useBalances';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { formatUsd } from '@/lib/format';
import { TALLY_FAUCET_URL } from '@/lib/constants';

interface FaucetResult {
  granted: number;
  digest: string | null;
  suiRequested: boolean;
  alreadyFunded: boolean;
}

export function FundingScreen() {
  const account = useCurrentAccount();
  const { dusdc, sui } = useBalances();
  const qc = useQueryClient();

  const grant = useMutation({
    mutationFn: async (): Promise<FaucetResult> => {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account?.address }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? 'Faucet request failed');
      }
      return res.json() as Promise<FaucetResult>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['balance'] }),
  });

  const dusdcVal = dusdc.data ?? 0;
  const suiVal = sui.data ?? 0;

  return (
    <Card className="mx-auto max-w-xl p-8">
      <h2 className="text-2xl font-bold tracking-[-0.03em]">You’re connected. One more step.</h2>
      <p className="mt-2 text-ink-soft">
        To place a bet you’ll need a little test dUSDC — it’s free on testnet, and we’ll send you
        some from the operator wallet.
      </p>

      <div className="mt-6 flex gap-4">
        <Card className="flex-1 p-4">
          <Stat label="dUSDC balance" value={formatUsd(dusdcVal)} accent={dusdcVal > 0 ? 'green' : 'clay'} />
          <div className="mt-1 text-xs text-faint">needed to bet</div>
        </Card>
        <Card className="flex-1 p-4">
          <Stat label="SUI balance" value={suiVal.toFixed(3)} accent={suiVal > 0.01 ? 'green' : 'ink'} />
          <div className="mt-1 text-xs text-faint">for gas</div>
        </Card>
      </div>

      <div className="mt-6 rounded-card border border-[#DCEAE2] bg-[#F4F7F4] p-5">
        {grant.isSuccess ? (
          <div>
            <div className="text-base font-bold text-green">
              {grant.data.alreadyFunded ? 'You’re funded ✓' : `Sent ${grant.data.granted} dUSDC ✓`}
            </div>
            <div className="mt-1 text-sm text-[#4a5a52]">
              Testnet only — no real value.{grant.data.suiRequested ? ' Gas SUI requested too.' : ''}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-card-in bg-green text-xl font-bold text-paper">
              +
            </div>
            <div className="flex-1">
              <div className="font-bold">Get test dUSDC</div>
              <div className="text-sm text-[#4a5a52]">
                An instant grant from the operator wallet — no real money involved.
              </div>
            </div>
            <Button onClick={() => grant.mutate()} disabled={grant.isPending}>
              {grant.isPending ? 'Sending…' : 'Send dUSDC'}
            </Button>
          </div>
        )}
      </div>

      {grant.isError && (
        <div className="mt-3 flex items-center gap-2 rounded-card-in border border-[#E6C9BE] bg-[#FBF1EC] px-4 py-3 text-sm">
          <span className="font-bold text-clay">!</span>
          <span className="text-[#a06550]">{(grant.error as Error).message}</span>
          <a
            href={TALLY_FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-auto font-semibold text-clay underline"
          >
            Request via form ↗
          </a>
        </div>
      )}

      <a
        href={TALLY_FAUCET_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-4 block text-center text-xs text-muted"
      >
        Or request via the operator form ↗
      </a>
    </Card>
  );
}
