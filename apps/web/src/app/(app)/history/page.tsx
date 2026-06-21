'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCurrentAccount } from '@mysten/dapp-kit';
import type { UIMessage } from 'ai';
import { ConnectScreen } from '@/components/onboarding/ConnectScreen';
import { MessageList } from '@/components/chat/MessageList';
import { Skeleton } from '@/components/ui/Skeleton';
import { useChats, useChatSession } from '@/lib/hooks/useChats';
import { applyOutcomes } from '@/lib/chat/applyOutcomes';
import { formatSettleTime } from '@/lib/format';
import type { AddToolResult } from '@/components/widgets/ReceiptController';

const noopResult: AddToolResult = () => {};

/** History — saved chat sessions (Postgres), replayed read-only with their signed receipts intact. */
export default function HistoryPage() {
  const account = useCurrentAccount();
  const chats = useChats();
  const [selected, setSelected] = useState<string | null>(null);
  const activeId = selected ?? chats.data?.[0]?.id ?? null;
  const session = useChatSession(activeId ?? undefined);

  if (!account) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <ConnectScreen />
      </div>
    );
  }

  const sessions = chats.data ?? [];

  // A FAILED fetch (429 rate-limit / 502 / network) must NOT read as "no sessions" — that would tell a
  // user with real saved history they have none. Distinguish error from genuine empty (mirrors the
  // resolver-failed-vs-no-account branch in BalanceManagerPanel).
  if (!chats.isLoading && !chats.data && chats.isError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-[15px] font-semibold">Couldn’t load your history</div>
          <p className="mx-auto mt-2 text-sm text-muted">
            A network hiccup reaching your saved sessions — your history isn’t gone, we just couldn’t fetch it. Retry in a moment.
          </p>
          <button
            type="button"
            onClick={() => void chats.refetch()}
            className="mt-5 inline-flex rounded-card-in bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!chats.isLoading && sessions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-[15px] font-semibold">No saved sessions yet</div>
          <p className="mx-auto mt-2 text-sm text-muted">
            Every conversation you have is saved here and replayed exactly — signed receipts and all.
            Start a chat to create your first one.
          </p>
          <Link
            href="/chat"
            className="mt-5 inline-flex rounded-card-in bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90"
          >
            Open chat →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-line bg-paper p-3.5 lg:block">
        <div className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Sessions</div>
        {chats.isLoading && <Skeleton className="h-16 w-full" />}
        <div className="flex flex-col gap-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s.id)}
              className={`rounded-card-in px-3 py-2.5 text-left transition ${
                s.id === activeId ? 'border border-line-strong bg-card' : 'hover:bg-canvas'
              }`}
            >
              <div className="truncate text-[13px] font-semibold">{s.title}</div>
              <div className="mt-0.5 font-mono text-[10.5px] text-faint">{formatSettleTime(Date.parse(s.updatedAt))}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* Tablet + mobile session picker */}
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-line bg-paper p-3 lg:hidden">
        {sessions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelected(s.id)}
            className={`shrink-0 whitespace-nowrap rounded-pill px-3 py-1.5 text-[12px] font-semibold transition ${
              s.id === activeId ? 'bg-ink text-paper' : 'border border-line-strong text-muted'
            }`}
          >
            {s.title.length > 22 ? `${s.title.slice(0, 22)}…` : s.title}
          </button>
        ))}
      </div>

      <div className="min-w-0 flex-1">
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
          <div className="flex h-full items-center justify-center text-sm text-muted">Select a session.</div>
        )}
      </div>
    </div>
  );
}
