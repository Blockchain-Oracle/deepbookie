'use client';

import { useChats } from '@/lib/hooks/useChats';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatSettleTime } from '@/lib/format';

/** Desktop conversation sidebar: New chat + the wallet's past sessions. Selecting one opens it
 *  read-only (archived) in the main area; "New chat" returns to a fresh live conversation. */
export function ChatSessionSidebar({
  selected,
  onSelect,
  onNew,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const chats = useChats();
  const sessions = chats.data ?? [];

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-paper p-3 lg:flex">
      <button
        type="button"
        onClick={onNew}
        className={`mb-3 rounded-card-in border px-3 py-2 text-left text-[13px] font-semibold transition ${
          selected === null ? 'border-line-strong bg-card' : 'border-line-strong bg-card hover:bg-canvas'
        }`}
      >
        + New chat
      </button>
      <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Conversations</div>
      {chats.isLoading && <Skeleton className="h-12 w-full" />}
      <div className="flex flex-col gap-1">
        {sessions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`rounded-card-in px-3 py-2 text-left transition ${
              s.id === selected ? 'border border-line-strong bg-card' : 'hover:bg-canvas'
            }`}
          >
            <div className="truncate text-[12.5px] font-semibold">{s.title}</div>
            <div className="mt-0.5 font-mono text-[10px] text-faint">{formatSettleTime(Date.parse(s.updatedAt))}</div>
          </button>
        ))}
        {!chats.isLoading && sessions.length === 0 && (
          <div className="px-1 text-[11.5px] text-faint">No past chats yet.</div>
        )}
      </div>
    </aside>
  );
}
