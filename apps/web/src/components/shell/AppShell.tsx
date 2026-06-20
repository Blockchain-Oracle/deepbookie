'use client';

import type { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { NetworkGuard } from './NetworkGuard';
import { DesktopNav } from './DesktopNav';
import { MobileTabBar } from './MobileTabBar';

/** Responsive app shell: top bar + desktop left-nav / mobile bottom-tab-bar around one content surface. */
export function AppShell({ children }: { children: ReactNode }) {
  // h-[100dvh] (dynamic viewport) — on iOS Safari 100vh overflows the visible area, so the inner
  // scroll container could never reach its bottom content under the browser chrome. dvh fixes that.
  return (
    <div className="flex h-[100dvh] flex-col bg-canvas">
      <TopBar />
      <NetworkGuard />
      <div className="flex min-h-0 flex-1">
        <DesktopNav />
        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  );
}
