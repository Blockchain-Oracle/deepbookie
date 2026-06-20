'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { BrandMark } from '@/components/ui/BrandMark';
import { MessagePart } from './MessagePart';
import type { AddToolResult } from '@/components/widgets/ReceiptController';

const SUGGESTIONS = [
  'What are the live BTC odds?',
  'What’s my balance?',
  'Walk me through placing a bet',
  'How does the vault work?',
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
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => onAction(s)}
            className="animate-fade-up rounded-pill border border-line-strong bg-card px-3.5 py-2 text-[13px] text-ink-soft transition hover:border-ink hover:text-ink"
            style={{ animationDelay: `${180 + i * 70}ms` }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  status,
  addToolResult,
  onAction,
}: {
  messages: UIMessage[];
  status: string;
  addToolResult: AddToolResult;
  onAction: (text: string) => void;
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
