import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { POLL } from '@/lib/constants';
import { apiGet } from './client';
import type { ChatSummary } from '@/lib/db/chats';
import type { ChatRow, TxOutcomeRow } from '@/lib/db/schema';

export type ChatSession = ChatRow & { outcomes: TxOutcomeRow[] };

/** The connected wallet's saved sessions (History list). */
export function useChats() {
  const owner = useCurrentAccount()?.address;
  return useQuery({
    queryKey: ['chats', owner],
    enabled: !!owner,
    queryFn: () => apiGet<ChatSummary[]>(`/api/chats?wallet=${owner}`),
    refetchInterval: POLL.activity,
  });
}

/** One saved session's full transcript (ownership-checked server-side). */
export function useChatSession(id?: string) {
  const owner = useCurrentAccount()?.address;
  return useQuery({
    queryKey: ['chat', id, owner],
    enabled: !!owner && !!id,
    queryFn: () => apiGet<ChatSession>(`/api/chats/${id}?wallet=${owner}`),
  });
}
