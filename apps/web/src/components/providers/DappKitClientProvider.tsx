'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DAppKitProvider } from '@mysten/dapp-kit-react';
import { dAppKit } from '@/lib/dapp-kit';

/**
 * Client provider tree: BYO TanStack QueryClient (the new dapp-kit packages don't bundle it) +
 * DAppKitProvider. Loaded via Providers with ssr:false (autoconnect needs `window`).
 */
export function DappKitClientProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>{children}</DAppKitProvider>
    </QueryClientProvider>
  );
}
