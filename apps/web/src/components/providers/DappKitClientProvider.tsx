'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { networkConfig } from '@/lib/dapp-kit';
import { NETWORK } from '@/lib/constants';

/**
 * Client provider tree (legacy @mysten/dapp-kit — the proven, CSS-styled wallet stack):
 * QueryClientProvider → SuiClientProvider → WalletProvider(autoConnect). Loaded via Providers
 * with ssr:false (autoconnect needs `window`). The dapp-kit stylesheet is imported in the root layout.
 */
export function DappKitClientProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={NETWORK}>
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
