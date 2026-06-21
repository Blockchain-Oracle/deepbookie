'use client';

import { useEffect, useRef, useState } from 'react';
import { useChats } from '@/lib/hooks/useChats';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatSettleTime } from '@/lib/format';

/**
 * Conversation history as a toggle DROPDOWN (not a sidebar): shows the current chat, and on tap drops
 * down the wallet's past sessions + New chat. Picking a session opens it read-only (archived); New chat
 * starts a fresh live one. Mirrors the WalletChip dropdown idiom (outside-click / Escape to close).
 */
export function ChatSessionDropdown({
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape (same pattern as WalletChip).
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const currentTitle = selected
    ? (sessions.find((s) => s.id === selected)?.title ?? 'Conversation')
    : 'New conversation';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex max-w-[min(70vw,300px)] items-center gap-2 rounded-pill border border-line bg-card py-1.5 pl-3 pr-2.5 text-[13px] font-semibold text-ink transition hover:bg-paper"
      >
        <ChatGlyph />
        <span className="truncate">{currentTitle}</span>
        <span className={`text-[9px] text-faint transition ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-[min(88vw,18rem)] overflow-hidden rounded-card border border-line-strong bg-card shadow-[var(--shadow-float)]">
          <button
            type="button"
            onClick={() => {
              onNew();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 border-b border-line px-3.5 py-3 text-left text-[13px] font-semibold text-green transition hover:bg-paper"
          >
            <span className="grid size-5 place-items-center rounded-full border border-green/40 text-[13px] leading-none">+</span>
            New chat
          </button>

          <div className="px-3.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">
            Conversations
          </div>
          <div className="max-h-[min(50vh,320px)] overflow-y-auto pb-1.5">
            {chats.isLoading && (
              <div className="px-3.5 py-1.5">
                <Skeleton className="h-9 w-full" />
              </div>
            )}
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelect(s.id);
                  setOpen(false);
                }}
                className={`flex w-full flex-col gap-0.5 px-3.5 py-2 text-left transition hover:bg-paper ${
                  s.id === selected ? 'bg-paper' : ''
                }`}
              >
                <span className="truncate text-[12.5px] font-medium text-ink">{s.title}</span>
                <span className="font-mono text-[10px] text-faint">{formatSettleTime(Date.parse(s.updatedAt))}</span>
              </button>
            ))}
            {!chats.isLoading && sessions.length === 0 && (
              <div className="px-3.5 py-3 text-[11.5px] text-faint">No past chats yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChatGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-faint" aria-hidden>
      <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2v-7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
