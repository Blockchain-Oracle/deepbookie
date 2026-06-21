import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { schibsted, plexMono } from '@/components/foundation/fonts';
import '@mysten/dapp-kit/dist/index.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'DeepBookie — trade DeepBook by chatting',
  description:
    'A chat app for trading DeepBook on Sui. Describe a trade in plain English — bet on BTC, swap tokens, manage your positions — and DeepBookie builds it. You sign every trade in your own wallet.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${schibsted.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
