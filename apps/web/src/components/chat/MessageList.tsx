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
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
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
