import './global.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { schibsted, plexMono } from '@/components/fonts';
import { DocsShell } from '@/components/shell/DocsShell';

export const metadata: Metadata = {
  title: {
    default: 'DeepBookie Docs — trade DeepBook by chatting',
    template: '%s · DeepBookie Docs',
  },
  description:
    'Docs for DeepBookie — a chat app for trading DeepBook on Sui. Describe a trade in plain English; DeepBookie builds it and you sign in your own wallet. Two markets: Predict (yes/no BTC bets) and Spot (the order book).',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${schibsted.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}
