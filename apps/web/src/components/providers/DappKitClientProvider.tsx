'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider, useSuiClientContext } from '@mysten/dapp-kit';
import {
  isEnokiNetwork,
  registerEnokiWallets,
  type RegisterEnokiWalletsOptions,
} from '@mysten/enoki';
import {
  ENOKI_API_KEY,
  ENOKI_GOOGLE_CLIENT_ID,
  googleLoginEnabled,
  networkConfig,
} from '@/lib/dapp-kit';
import { NETWORK } from '@/lib/constants';

// enoki 1.1.x options are a union (single-`client` form | multi-`clients` form); pull the
// client-bearing branch so we can type the cast that bridges the legacy dapp-kit SuiClient
// to enoki's expected core client (same nominal mismatch the 0.6 reference cast through).
type EnokiClient = Extract<RegisterEnokiWalletsOptions, { client: unknown }>['client'];

/**
 * Client provider tree (legacy @mysten/dapp-kit — the proven, CSS-styled wallet stack):
 * QueryClientProvider → SuiClientProvider → [RegisterEnokiWallets] → WalletProvider(autoConnect).
 * Loaded via Providers with ssr:false (autoconnect needs `window`). The dapp-kit stylesheet is
 * imported in the root layout. RegisterEnokiWallets adds Google zkLogin to the ConnectButton modal.
 */
export function DappKitClientProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={NETWORK}>
        <RegisterEnokiWallets />
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

/**
 * Registers Enoki zkLogin wallets (Google sign-in) with dapp-kit so "Sign in with Google"
 * appears in the same ConnectButton modal as browser-extension wallets, signing through the
 * unchanged useSignAndExecuteTransaction path. No-op unless the public Enoki env vars are set
 * (`googleLoginEnabled`) and the active network is Enoki-supported. Slice A: login only — gasless
 * sponsorship is Slice B. Ported from onemem/apps/hosted-dashboard/components/HostedProviders.tsx.
 */
function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    if (!googleLoginEnabled || !isEnokiNetwork(network)) return;

    const { unregister } = registerEnokiWallets({
      apiKey: ENOKI_API_KEY,
      providers: {
        google: {
          clientId: ENOKI_GOOGLE_CLIENT_ID,
          // Match the EXACT redirect URI registered in the Google OAuth client (origin-only,
          // no path). registerEnokiWallets otherwise defaults to the full current URL
          // (e.g. .../chat), which fails with redirect_uri_mismatch.
          redirectUrl: window.location.origin,
        },
      },
      // The legacy dapp-kit SuiClient and enoki's expected client share the same RPC surface;
      // cast bridges the minor cross-package type drift (same seam as the reference impl).
      client: client as unknown as EnokiClient,
      network,
    });

    return unregister;
  }, [client, network]);

  return null;
}
