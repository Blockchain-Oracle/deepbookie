'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Wallet detection + autoconnect need `window`; load the provider client-only so SSR markup
// never disagrees with the post-autoconnect client render (the App-Router hydration footgun).
const DappKitClientProvider = dynamic(
  () => import('./DappKitClientProvider').then((m) => m.DappKitClientProvider),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  return <DappKitClientProvider>{children}</DappKitClientProvider>;
}
