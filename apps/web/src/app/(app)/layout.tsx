import type { ReactNode } from 'react';
import { Providers } from '@/components/providers/Providers';
import { TopBar } from '@/components/shell/TopBar';
import { NetworkGuard } from '@/components/shell/NetworkGuard';

/** Wallet-gated app shell. Providers load ssr:false; the landing (/) stays SSR and provider-free. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col bg-canvas">
        <TopBar />
        <NetworkGuard />
        <main className="flex-1">{children}</main>
      </div>
    </Providers>
  );
}
