'use client';

import { useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { Composer } from './Composer';
import { MessageList } from './MessageList';

export function Chat() {
  const account = useCurrentAccount();
  const [input, setInput] = useState('');

  // Recreated only when the connected address changes; carries walletAddress to the route
  // (quote sender only — never trusted for auth, per §5.1).
  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat', body: { walletAddress: account?.address } }),
    [account?.address],
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const onSend = () => {
    const text = input.trim();
    if (!text || status !== 'ready') return;
    sendMessage({ text });
    setInput('');
  };

  return (
    <div className="flex h-full flex-col">
      <MessageList messages={messages} status={status} />
      <Composer value={input} onChange={setInput} onSend={onSend} disabled={status !== 'ready'} />
    </div>
  );
}
