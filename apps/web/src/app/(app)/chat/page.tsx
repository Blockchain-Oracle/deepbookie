import { ChatWorkspace } from '@/components/chat/ChatWorkspace';

/**
 * Chat surface — launcher-first: the chat-home launcher renders immediately (even before connecting).
 * The workspace adds a conversation sidebar (when connected); selecting a past chat opens it read-only,
 * "New chat" starts a fresh live session. Wallet-gated cards open the wallet modal on tap.
 */
export default function ChatPage() {
  return <ChatWorkspace />;
}
