'use client';

import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { useBalances } from '@/lib/hooks/useBalances';
import { ConnectScreen } from '@/components/onboarding/ConnectScreen';
import { FundingScreen } from '@/components/onboarding/FundingScreen';
import { Chat } from '@/components/chat/Chat';

/** Chat surface: onboarding gate (connect → fund) → the genUI chat. */
export default function ChatPage() {
  const account = useCurrentAccount();
  const { dusdc } = useBalances();

  if (!account) return <div className="p-6">{<ConnectScreen />}</div>;
  if ((dusdc.data ?? 0) <= 0) return <div className="p-6">{<FundingScreen />}</div>;

  return <Chat />;
}
