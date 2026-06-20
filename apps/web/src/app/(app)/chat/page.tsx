'use client';

import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { useBalances } from '@/lib/hooks/useBalances';
import { ConnectScreen } from '@/components/onboarding/ConnectScreen';
import { FundingScreen } from '@/components/onboarding/FundingScreen';

/**
 * Chat surface. For Phase 2 this orchestrates onboarding (connect → fund); the genUI chat itself
 * lands in Phase 4.
 */
export default function ChatPage() {
  const account = useCurrentAccount();
  const { dusdc } = useBalances();

  if (!account) return <div className="p-6">{<ConnectScreen />}</div>;
  if ((dusdc.data ?? 0) <= 0) return <div className="p-6">{<FundingScreen />}</div>;

  return (
    <div className="flex h-full items-center justify-center p-10 text-center">
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.1em] text-faint">
          Connected &amp; funded
        </div>
        <div className="mt-2 text-lg font-semibold text-ink">The chat lands in Phase 4.</div>
      </div>
    </div>
  );
}
