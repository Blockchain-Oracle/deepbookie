'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { MessagePart } from './MessagePart';
import { ChatHome } from './chatHome/ChatHome';
import type { AddToolResult, OnSignOutcome } from '@/components/widgets/ReceiptController';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Only follow the stream when the user is already near the bottom — don't yank them down while
    // they scroll up to read earlier messages. 'auto' (not 'smooth') so per-token scrolls don't stack.
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      endRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, status]);

  // Empty conversation → the chat-home launcher (full width so the rail breathes).
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <ChatHome onAction={onAction} />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {/* Key by id+index on purpose: useChat can briefly emit a duplicate message id during
            streaming/restore, and a bare m.id key crashes React — the index disambiguates. */}
        {messages.map((m, mi) => (
          <div key={`${m.id}-${mi}`} className="flex flex-col gap-2">
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
