'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';

const TARGET_CHAIN = 'sui:testnet';

/** Wrong-network banner — the app only configures testnet, so the risk is a mainnet wallet. */
export function NetworkGuard() {
  const account = useCurrentAccount();
  if (!account) return null;

  const chains = (account.chains ?? []) as readonly string[];
  if (chains.includes(TARGET_CHAIN)) return null;

  return (
    <div className="flex items-center gap-3 border-b border-[#ECDCBC] bg-[#FBF6EC] px-5 py-3 text-sm text-[#5e4d1f]">
      <span className="size-2 shrink-0 rounded-full bg-[#9c7a2a]" />
      <span>
        Your wallet isn’t on <b>Sui Testnet</b>. Switch networks in your wallet to trade — your
        address stays the same.
      </span>
    </div>
  );
}
