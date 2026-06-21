import './global.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { schibsted, plexMono } from '@/components/fonts';
import { DocsShell } from '@/components/shell/DocsShell';

export const metadata: Metadata = {
  title: {
    default: 'DeepBookie Docs — the agent proposes, you sign',
    template: '%s · DeepBookie Docs',
  },
  description:
    'Documentation for DeepBookie — an AI agent for trading DeepBook Predict on Sui. One tool registry powers the web app, MCP server, CLI, and skill; every write is an unsigned transaction you sign at the edge.',
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
