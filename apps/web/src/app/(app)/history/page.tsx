'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCurrentAccount } from '@mysten/dapp-kit';
import type { UIMessage } from 'ai';
import { ConnectScreen } from '@/components/onboarding/ConnectScreen';
import { MessageList } from '@/components/chat/MessageList';
import { Page, PageHeader } from '@/components/shell/Page';
import { Skeleton } from '@/components/ui/Skeleton';
import { useChats, useChatSession, type ChatSession } from '@/lib/hooks/useChats';
import type { ChatSummary } from '@/lib/db/chats';
import { applyOutcomes } from '@/lib/chat/applyOutcomes';
import { formatSettleTime } from '@/lib/format';
import type { AddToolResult } from '@/components/widgets/ReceiptController';

const noopResult: AddToolResult = () => {};

/**
 * History — your signed sessions as a JOURNAL: a gallery of session cards (title, when, how many writes
 * you signed, a wax seal on signed ones). Tap a card to replay it read-only with its receipts intact.
 * Distinct from the chat: chat is a live conversation; history is an archive you browse.
 */
export default function HistoryPage() {
  const account = useCurrentAccount();
  const chats = useChats();
  const [selected, setSelected] = useState<string | null>(null);

  if (!account) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <ConnectScreen />
      </div>
    );
  }

  // A selected session opens full-height replay (its own layout, not the padded gallery).
  if (selected) {
    const title = chats.data?.find((s) => s.id === selected)?.title ?? 'Session';
    return <HistoryReplay id={selected} title={title} onBack={() => setSelected(null)} />;
  }

  const sessions = chats.data ?? [];
  const signedTotal = sessions.reduce((n, s) => n + s.signed, 0);

  return (
    <Page>
      <PageHeader
        title="History"
        subtitle={
          sessions.length
            ? `${sessions.length} session${sessions.length === 1 ? '' : 's'} · ${signedTotal} signed action${signedTotal === 1 ? '' : 's'} — replayed exactly, receipts and all`
            : 'Your signed sessions, replayed exactly — receipts and all'
        }
      />

      {chats.isLoading && !chats.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[124px] w-full rounded-card" />
          ))}
        </div>
      ) : !chats.data && chats.isError ? (
        <Centered
          title="Couldn’t load your history"
          body="A network hiccup reaching your saved sessions — your history isn’t gone, we just couldn’t fetch it."
          action={
            <button
              type="button"
              onClick={() => void chats.refetch()}
              className="rounded-card-in bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90"
            >
              Retry
            </button>
          }
        />
      ) : sessions.length === 0 ? (
        <Centered
          title="No saved sessions yet"
          body="Every conversation you have is saved here and replayed exactly — signed receipts and all. Start a chat to create your first one."
          action={
            <Link
              href="/chat"
              className="rounded-card-in bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90"
            >
              Open chat →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} onOpen={() => setSelected(s.id)} />
          ))}
        </div>
      )}
    </Page>
  );
}

/** One journal card. Signed sessions get a wax seal + a green "N signed" chip; the top edge is a
 *  faint receipt perforation. Hover lifts the card. */
function SessionCard({ session, onOpen }: { session: ChatSummary; onOpen: () => void }) {
  const signed = session.signed;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex min-h-[124px] flex-col overflow-hidden rounded-card border border-line bg-card p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-[var(--shadow-raised)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{ background: 'repeating-linear-gradient(90deg,#E6E1D8 0 5px,transparent 5px 10px)' }}
      />
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-[14px] font-bold leading-snug text-ink">{session.title}</span>
        {signed > 0 && <WaxSeal />}
      </div>

      <div className="mt-auto flex items-center justify-between pt-5">
        <span className="font-mono text-[10.5px] text-faint">{formatSettleTime(Date.parse(session.updatedAt))}</span>
        {signed > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-pill bg-green/10 px-2 py-0.5 text-[10.5px] font-semibold text-green">
            ✓ {signed} signed
          </span>
        ) : (
          <span className="inline-flex items-center rounded-pill border border-line px-2 py-0.5 text-[10.5px] font-medium text-faint">
            read-only
          </span>
        )}
      </div>

      <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-muted transition group-hover:text-ink">
        Replay <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </button>
  );
}

/** A tiny wax seal — evokes the SignReceipt stamp; marks a session where real money was signed. */
function WaxSeal() {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-green/12 text-green ring-1 ring-green/25" aria-hidden>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Full-height read-only replay of one session (back to the gallery). */
function HistoryReplay({ id, title, onBack }: { id: string; title: string; onBack: () => void }) {
  const session = useChatSession(id);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-paper px-4 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="rounded-pill border border-line-strong bg-card px-3 py-1.5 text-[12.5px] font-semibold text-muted transition hover:bg-paper hover:text-ink"
        >
          ← History
        </button>
        <span className="truncate text-[13.5px] font-semibold text-ink">{title}</span>
        <span className="ml-auto rounded-pill border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-faint">
          read-only
        </span>
      </div>
      {/* flex-col so MessageList's `flex-1 overflow-y-auto` resolves + actually scrolls (a plain
          block parent collapses flex-1 → the transcript overflowed with no scroll). */}
      <div className="flex min-h-0 flex-1 flex-col">
        {session.isLoading && !session.data ? (
          <div className="p-6">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : session.data ? (
          <MessageList
            messages={applyOutcomes(
              ((session.data as ChatSession).messages as unknown as UIMessage[]) ?? [],
              (session.data as ChatSession).outcomes ?? [],
            )}
            status="ready"
            addToolResult={noopResult}
            onAction={() => {}}
            readOnly
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">Couldn’t load this session.</div>
        )}
      </div>
    </div>
  );
}

function Centered({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="text-[15px] font-semibold">{title}</div>
        <p className="mx-auto mt-2 text-sm text-muted">{body}</p>
        <div className="mt-5 inline-flex">{action}</div>
      </div>
    </div>
  );
}
