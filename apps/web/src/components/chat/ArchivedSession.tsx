'use client';

import type { UIMessage } from 'ai';
import { MessageList } from './MessageList';
import { Skeleton } from '@/components/ui/Skeleton';
import { useChatSession } from '@/lib/hooks/useChats';
import { applyOutcomes } from '@/lib/chat/applyOutcomes';
import type { AddToolResult } from '@/components/widgets/ReceiptController';

const noopResult: AddToolResult = () => {};

/** A past conversation opened from the sidebar — replayed READ-ONLY (static receipts, no live cards,
 *  no re-prompt/re-sign). "New chat" returns to a fresh live conversation. */
export function ArchivedSession({ id, onNew }: { id: string; onNew: () => void }) {
  const session = useChatSession(id);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line bg-paper px-4 py-2.5">
        <span className="text-[12px] font-semibold text-muted">Archived conversation · read-only</span>
        <button
          type="button"
          onClick={onNew}
          className="rounded-pill bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-paper transition hover:opacity-90"
        >
          New chat
        </button>
      </div>
      {session.isLoading && !session.data ? (
        <div className="p-6">
          <Skeleton className="h-40 w-full" />
        </div>
      ) : session.data ? (
        <MessageList
          messages={applyOutcomes((session.data.messages as unknown as UIMessage[]) ?? [], session.data.outcomes ?? [])}
          status="ready"
          addToolResult={noopResult}
          onAction={() => {}}
          readOnly
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted">Couldn’t load this conversation.</div>
      )}
    </div>
  );
}
