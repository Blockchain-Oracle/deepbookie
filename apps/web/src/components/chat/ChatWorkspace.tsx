'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Chat } from './Chat';
import { ArchivedSession } from './ArchivedSession';
import { ChatSessionSidebar } from './ChatSessionSidebar';

/**
 * The chat surface: a conversation sidebar (when connected) + the main area. The main shows the LIVE
 * chat by default; selecting a past session from the sidebar opens it READ-ONLY (archived). "New chat"
 * remounts a fresh live session (the old one stays saved + archived in History).
 */
export function ChatWorkspace() {
  const account = useCurrentAccount();
  const [viewing, setViewing] = useState<string | null>(null); // a selected archived session id
  const [liveKey, setLiveKey] = useState(0); // bump to remount <Chat/> for "New chat"

  const newChat = () => {
    setViewing(null);
    setLiveKey((k) => k + 1);
  };

  return (
    <div className="flex h-full min-h-0">
      {account && <ChatSessionSidebar selected={viewing} onSelect={setViewing} onNew={newChat} />}
      <div className="min-w-0 flex-1">
        {viewing ? <ArchivedSession id={viewing} onNew={newChat} /> : <Chat key={liveKey} />}
      </div>
    </div>
  );
}
