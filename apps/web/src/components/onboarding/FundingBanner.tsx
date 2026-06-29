'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useBalances } from '@/lib/hooks/useBalances';
import { FAUCET_MIN_SUI, TALLY_FAUCET_URL } from '@/lib/constants';

interface FaucetResult {
  granted: number;
  digest: string | null;
  suiRequested: boolean;
  alreadyFunded: boolean;
}

/**
 * Contextual funding nudge (launcher-first): a slim, dismissible strip shown when the wallet is
 * connected but can't actually bet yet — i.e. holds no dUSDC OR has no SUI for gas (the latter is the
 * common case for fresh zkLogin/Google users, since the public gas faucet is rate-limited). Replaces
 * the old hard FundingScreen gate — the launcher stays usable; this offers a one-tap grant (dUSDC +
 * operator-funded gas) when you actually need funds. Reuses /api/faucet.
 */
export function FundingBanner() {
  const account = useCurrentAccount();
  const { dusdc, sui } = useBalances();
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

  // Show when connected + can't bet yet: no dUSDC OR no gas SUI (keep showing after a grant to
  // confirm), and not dismissed. Gas matters because a fresh zkLogin address has 0 SUI.
  const needsFunding = (dusdc.data ?? 0) <= 0 || (sui.data ?? 0) < FAUCET_MIN_SUI;
  if (!account || dismissed) return null;
  if (!needsFunding && !grant.isSuccess) return null;

  return (
    <div className="mx-auto mb-2 flex w-full max-w-2xl items-center gap-3 rounded-card-in border border-[#DCEAE2] bg-[#F4F7F4] px-3.5 py-2.5">
      {grant.isSuccess ? (
        <span className="text-[13px] font-semibold text-green">
          {grant.data.alreadyFunded ? "You're funded ✓" : 'Funded ✓ — dUSDC + gas, testnet only'}
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
          <span className="flex-1 text-[13px] text-ink-soft">Need testnet funds to bet? dUSDC + a little gas — free.</span>
          <button
            type="button"
            onClick={() => grant.mutate()}
            disabled={grant.isPending}
            className="rounded-card-in bg-green px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {grant.isPending ? 'Sending…' : 'Get test funds'}
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
