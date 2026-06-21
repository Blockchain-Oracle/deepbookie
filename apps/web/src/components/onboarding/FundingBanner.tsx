'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useBalances } from '@/lib/hooks/useBalances';
import { TALLY_FAUCET_URL } from '@/lib/constants';

interface FaucetResult {
  granted: number;
  digest: string | null;
  suiRequested: boolean;
  alreadyFunded: boolean;
}

/**
 * Contextual funding nudge (launcher-first): a slim, dismissible strip shown only when the wallet is
 * connected but holds no dUSDC. Replaces the old hard FundingScreen gate — the launcher stays usable;
 * this just offers a one-tap operator grant when you actually need funds to bet. Reuses /api/faucet.
 */
export function FundingBanner() {
  const account = useCurrentAccount();
  const { dusdc } = useBalances();
  const qc = useQueryClient();
  const [dismissed, setDismissed] = useState(false);

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

  // Only when connected + unfunded (keep showing after a grant to confirm), and not dismissed.
  if (!account || dismissed) return null;
  if ((dusdc.data ?? 0) > 0 && !grant.isSuccess) return null;

  return (
    <div className="mx-auto mb-2 flex w-full max-w-2xl items-center gap-3 rounded-card-in border border-[#DCEAE2] bg-[#F4F7F4] px-3.5 py-2.5">
      {grant.isSuccess ? (
        <span className="text-[13px] font-semibold text-green">
          {grant.data.alreadyFunded ? "You're funded ✓" : `Sent ${grant.data.granted} dUSDC ✓ — testnet only`}
        </span>
      ) : grant.isError ? (
        <>
          <span className="text-[13px] text-[#a06550]">{(grant.error as Error).message}</span>
          <a href={TALLY_FAUCET_URL} target="_blank" rel="noreferrer" className="text-[12.5px] font-semibold text-clay underline">
            Request via form ↗
          </a>
        </>
      ) : (
        <>
          <span className="size-5 shrink-0 rounded-card-in bg-green text-center text-[13px] font-bold leading-5 text-paper">+</span>
          <span className="flex-1 text-[13px] text-ink-soft">Need test dUSDC to bet? It's free on testnet.</span>
          <button
            type="button"
            onClick={() => grant.mutate()}
            disabled={grant.isPending}
            className="rounded-card-in bg-green px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {grant.isPending ? 'Sending…' : 'Get dUSDC'}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="ml-1 shrink-0 text-[15px] leading-none text-muted transition hover:text-ink"
      >
        ×
      </button>
    </div>
  );
}
