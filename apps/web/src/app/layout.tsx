import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { schibsted, plexMono } from '@/components/foundation/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'DeepBookie — the agent proposes, you sign',
  description:
    'Talk to an AI that prices DeepBook Predict bets off a live volatility model. It proposes; you sign every trade in your own wallet. It holds no key.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${schibsted.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
