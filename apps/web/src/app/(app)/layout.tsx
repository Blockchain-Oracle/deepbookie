import type { ReactNode } from 'react';
import { Providers } from '@/components/providers/Providers';
import { AppShell } from '@/components/shell/AppShell';

/** Wallet-gated app shell. Providers load ssr:false; the landing (/) stays SSR and provider-free. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
