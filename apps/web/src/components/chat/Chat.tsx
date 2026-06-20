'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Composer } from './Composer';
import { MessageList } from './MessageList';
import type { AddToolResult } from '@/components/widgets/ReceiptController';

export function Chat() {
  const account = useCurrentAccount();
  const [input, setInput] = useState('');

  // Recreated only when the connected address changes; carries walletAddress to the route
  // (quote sender only — never trusted for auth, per §5.1).
  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat', body: { walletAddress: account?.address } }),
    [account?.address],
  );

  const { messages, sendMessage, status, addToolResult } = useChat({
    transport,
    // Resume the stream once the user has signed (or declined) every proposed write.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  // Deep-link intent: a "Trade"/"Bet" tap lands here as ?q=<prompt> — auto-send it once, then
  // clear the param so a refresh doesn't resend. Read via window to avoid a Suspense boundary.
  const autoSent = useRef(false);
  useEffect(() => {
    if (autoSent.current) return;
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) {
      autoSent.current = true;
      sendMessage({ text: q });
      window.history.replaceState(null, '', '/chat');
    }
  }, [sendMessage]);

  const onSend = () => {
    const text = input.trim();
    if (!text || status !== 'ready') return;
    sendMessage({ text });
    setInput('');
  };

  return (
    <div className="flex h-full flex-col">
      <MessageList
        messages={messages}
        status={status}
        addToolResult={addToolResult as unknown as AddToolResult}
        onAction={(text) => sendMessage({ text })}
      />
      <Composer value={input} onChange={setInput} onSend={onSend} disabled={status !== 'ready'} />
    </div>
  );
}
