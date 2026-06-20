'use client';

import { useState } from 'react';
import { ConnectModal, useCurrentAccount } from '@mysten/dapp-kit';
import { CategoryCard } from './CategoryCard';
import { CategoryTile } from './CategoryTile';
import { CATEGORIES, type Category } from './categories';

/**
 * The chat-home launcher (the empty-conversation surface). Greeting + the 9 category cards in two
 * layouts from one data source: a horizontal rail at md+, a featured hero + 2-col grid on mobile.
 * Launcher-first: it renders before connecting; wallet-gated cards show the disabled state and open
 * the wallet modal on tap. Tapping a card sends its prompt (the launcher then collapses).
 */
export function ChatHome({ onAction }: { onAction: (text: string) => void }) {
  const account = useCurrentAccount();
  const [connectOpen, setConnectOpen] = useState(false);
  const needWallet = () => setConnectOpen(true);
  const disabled = (c: Category) => !!c.needsWallet && !account;

  return (
    <div className="py-8">
      {/* greeting */}
      <div className="px-4 text-center">
        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-pill border border-line bg-card px-3 py-[5px]">
          <span className="live-dot size-1.5 rounded-full bg-green" />
          <span className="font-mono text-[10.5px] text-ink-soft">agent online · reads live markets</span>
        </div>
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">What can I help you trade?</h2>
        <p className="mx-auto mt-1.5 max-w-[440px] text-[13.5px] leading-[1.45] text-[#7d7870]">
          Ask about a market, place a bet, or swap — <b className="text-ink-soft">you sign everything.</b> Or start from a
          category below.
        </p>
      </div>

      {/* desktop + tablet: horizontal rail with edge-fades */}
      <div className="relative mt-6 hidden md:block">
        <div className="pointer-events-none absolute bottom-3.5 left-0 top-0 z-[2] w-[30px] bg-gradient-to-r from-canvas to-transparent" />
        <div className="pointer-events-none absolute bottom-3.5 right-0 top-0 z-[2] w-[46px] bg-gradient-to-l from-canvas to-transparent" />
        <div className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-[18px] pb-4 pt-1.5 [scrollbar-color:#cfc9bd_transparent] [scrollbar-width:thin]">
          {CATEGORIES.map((c, i) => (
            <CategoryCard key={c.id} category={c} index={i} disabled={disabled(c)} onAction={onAction} onNeedWallet={needWallet} />
          ))}
        </div>
      </div>

      {/* mobile: featured hero + 2-col grid (no horizontal scroll) */}
      <div className="mt-5 px-4 md:hidden">
        <CategoryTile category={CATEGORIES[0]!} variant="hero" disabled={false} onAction={onAction} onNeedWallet={needWallet} />
        <div className="my-3.5 flex items-center gap-2.5">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-faint">Or pick a category</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {CATEGORIES.slice(1).map((c) => (
            <CategoryTile key={c.id} category={c} variant="tile" disabled={disabled(c)} onAction={onAction} onNeedWallet={needWallet} />
          ))}
        </div>
      </div>

      <ConnectModal trigger={<span aria-hidden className="hidden" />} open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
}
