'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { BrandMark } from '@/components/ui/BrandMark';
import { MessagePart } from './MessagePart';
import type { AddToolResult, OnSignOutcome } from '@/components/widgets/ReceiptController';

// Category carousel for the chat home screen — each card sends its starter prompt on click.
const CATEGORIES = [
  { title: 'Markets & odds', blurb: 'Live BTC markets and the probability curve.', prompt: 'What are the live BTC odds right now?', dot: 'bg-green' },
  { title: 'Place a bet', blurb: 'Price and propose an UP/DOWN bet you sign.', prompt: 'Walk me through a $1 UP bet on BTC.', dot: 'bg-ink' },
  { title: 'Your account', blurb: 'Balance, open positions, and PnL.', prompt: 'What’s my balance?', dot: 'bg-wallet' },
  { title: 'Vault & liquidity', blurb: 'Provide liquidity and earn the maker spread.', prompt: 'How does the vault work?', dot: 'bg-mint' },
];

/** Livelier welcome: gentle staggered entrance + clickable starter prompts (they send on click). */
function EmptyState({ onAction }: { onAction: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="animate-fade-up">
        <BrandMark size={32} />
      </div>
      <div className="animate-fade-up text-lg font-semibold tracking-[-0.02em] [animation-delay:60ms]">
        Ask about a market
      </div>
      <div className="animate-fade-up max-w-xs text-sm text-muted [animation-delay:120ms]">
        I read the live vol surface, propose a bet, and you sign it yourself — I never hold a key.
      </div>
      <div className="mt-4 w-full">
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.title}
              type="button"
              onClick={() => onAction(c.prompt)}
              style={{ animationDelay: `${160 + i * 70}ms` }}
              className="animate-fade-up group flex w-56 shrink-0 snap-start flex-col rounded-card border border-line bg-card p-4 text-left transition hover:border-ink hover:shadow-[var(--shadow-raised)]"
            >
              <span className={`size-2 rounded-[3px] ${c.dot}`} />
              <span className="mt-2.5 text-[14px] font-bold">{c.title}</span>
              <span className="mt-1 text-[12px] leading-snug text-muted">{c.blurb}</span>
              <span className="mt-3 text-[12px] font-medium text-ink-soft transition group-hover:text-green">
                “{c.prompt}” →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  status,
  addToolResult,
  onAction,
  onOutcome,
}: {
  messages: UIMessage[];
  status: string;
  addToolResult: AddToolResult;
  onAction: (text: string) => void;
  onOutcome?: OnSignOutcome;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {messages.length === 0 && <EmptyState onAction={onAction} />}
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col gap-2">
            {m.parts.map((part, i) => (
              <MessagePart
                key={`${m.id}-${i}`}
                role={m.role}
                part={part}
                addToolResult={addToolResult}
                onAction={onAction}
                onOutcome={onOutcome}
              />
            ))}
          </div>
        ))}
        {status === 'submitted' && (
          <div className="flex items-center gap-1.5 text-faint">
            <span className="size-1.5 animate-bounce rounded-full bg-faint [animation-delay:-0.2s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-faint [animation-delay:-0.1s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-faint" />
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
