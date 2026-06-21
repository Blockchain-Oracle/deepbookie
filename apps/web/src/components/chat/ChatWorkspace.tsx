'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Chat } from './Chat';
import { ArchivedSession } from './ArchivedSession';
import { ChatSessionDropdown } from './ChatSessionDropdown';

/**
 * The chat surface: a conversation DROPDOWN (when connected) above the main area — tap it to drop down
 * past sessions + New chat, tap again to close. The main area shows the LIVE chat by default; selecting
 * a past session opens it READ-ONLY (archived). "New chat" remounts a fresh live session (the old one
 * stays saved + archived in History). Works on every breakpoint (the old sidebar was desktop-only).
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
    <div className="flex h-full min-h-0 flex-col">
      {account && (
        <div className="flex shrink-0 items-center border-b border-line px-3 py-2 sm:px-4">
          <ChatSessionDropdown selected={viewing} onSelect={setViewing} onNew={newChat} />
        </div>
      )}
      <div className="min-h-0 min-w-0 flex-1">
        {viewing ? <ArchivedSession id={viewing} onNew={newChat} /> : <Chat key={liveKey} />}
      </div>
    </div>
  );
}
