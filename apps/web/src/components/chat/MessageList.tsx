'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { BrandMark } from '@/components/ui/BrandMark';
import { MessagePart } from './MessagePart';

export function MessageList({ messages, status }: { messages: UIMessage[]; status: string }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BrandMark size={32} />
            <div className="text-lg font-semibold tracking-[-0.02em]">Ask about a market</div>
            <div className="max-w-xs text-sm text-muted">
              e.g. “Will BTC be above $63k in the next half hour?” — I’ll read the live odds and
              propose a bet you sign yourself.
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col gap-2">
            {m.parts.map((part, i) => (
              <MessagePart key={`${m.id}-${i}`} role={m.role} part={part} />
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
