import { Chat } from '@/components/chat/Chat';

/**
 * Chat surface — launcher-first: the chat-home launcher renders immediately (even before connecting).
 * Wallet-gated cards show a "Connect wallet to use" state + open the wallet modal on tap; funding is
 * a contextual banner inside Chat (no hard connect→fund gate anymore).
 */
export default function ChatPage() {
  return <Chat />;
}
