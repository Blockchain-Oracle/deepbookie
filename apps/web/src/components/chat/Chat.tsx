'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Composer } from './Composer';
import { MessageList } from './MessageList';
import { FundingBanner } from '@/components/onboarding/FundingBanner';
import { usePositions } from '@/lib/hooks/usePositions';
import { useBalanceManager } from '@/lib/hooks/useBalanceManager';
import type { AddToolResult, SignOutcome } from '@/components/widgets/ReceiptController';

export function Chat() {
  const account = useCurrentAccount();
  const [input, setInput] = useState('');
  // Stable per session — keys this conversation in History (persisted server-side per turn).
  const [chatId] = useState(() => crypto.randomUUID());
  // The wallet's manager, resolved + cached client-side (React Query). Passed to the route so the
  // server doesn't re-resolve via the lagging indexer on every request (which caused balance to
  // flip between "here it is" and "no account"). Auth still never trusts this — writes are signed.
  const managerId = usePositions(account?.address).data?.managerId ?? null;
  // The wallet's DeepBook spot account, resolved + cached the same way (so spot tools see it without
  // re-resolving per request). Auth still never trusts it — spot writes are signed in the wallet.
  const bmData = useBalanceManager(account?.address).data;
  const balanceManagerId = bmData?.balanceManagerId ?? null;
  // BM existence is UNKNOWN when storage is blocked OR the resolver itself failed (a transient
  // 429/500/timeout — distinct from a genuine "no account" null). In both cases tell the route NOT to
  // proactively propose creating one: minting a duplicate shared BM orphans a returning user's funds.
  const balanceManagerUnknown = (bmData?.storageBlocked ?? false) || (bmData?.error ?? false);

  // Recreated when the address or resolved managers change; carries all to the route.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: { walletAddress: account?.address, managerId, balanceManagerId, balanceManagerUnknown, chatId },
      }),
    [account?.address, managerId, balanceManagerId, balanceManagerUnknown, chatId],
  );

  const { messages, sendMessage, status, addToolResult, error, regenerate } = useChat({
    transport,
    // Resume the stream once the user has signed (or declined) every proposed write.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  // Deep-link intent: a "Trade"/"Bet" tap lands here as ?q=<prompt> — auto-send it once, then
  // clear the param so a refresh doesn't resend. Read via window to avoid a Suspense boundary.
  const autoSent = useRef(false);
  useEffect(() => {
    if (autoSent.current) return;
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) {
      autoSent.current = true;
      sendMessage({ text: q });
      window.history.replaceState(null, '', '/chat');
    }
  }, [sendMessage]);

  const onSend = () => {
    const text = input.trim();
    if (!text || status !== 'ready') return;
    sendMessage({ text });
    setInput('');
  };

  // Record the sign outcome the instant it happens — independent of the stream resume, so a signed
  // trade is never lost (the plan's belt-and-suspenders save-on-sign). Keyed by toolCallId.
  const onOutcome = useCallback(
    (o: SignOutcome) => {
      const wallet = account?.address;
      if (!wallet) return;
      const body = JSON.stringify({ ...o, walletAddress: wallet });
      // Bounded retry — a signed trade's ledger row must survive a transient blip, not be lost.
      void (async () => {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const res = await fetch(`/api/chats/${chatId}/outcome`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body,
            });
            if (res.ok) return;
          } catch {
            /* network blip — retry */
          }
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
      })();
    },
    [account?.address, chatId],
  );

  return (
    <div className="flex h-full flex-col">
      <MessageList
        messages={messages}
        status={status}
        addToolResult={addToolResult as unknown as AddToolResult}
        onAction={(text) => sendMessage({ text })}
        onOutcome={onOutcome}
      />
      {status === 'error' && (
        // A stream failure (network/provider/rate-limit) otherwise shows nothing and leaves the
        // composer disabled — surface it with a Retry that re-runs the last turn (regenerate).
        <div className="mx-4 mb-2 flex items-center justify-between gap-3 rounded-card-in border border-[#E6C9BE] bg-[#FBF1EC] px-3.5 py-2.5">
          <span className="text-[12.5px] font-medium text-clay">
            {error?.message ? 'The assistant hit an error — try again.' : 'Something went wrong — try again.'}
          </span>
          <button
            type="button"
            onClick={() => void regenerate()}
            className="flex-none rounded-card-in bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper transition hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}
      <div className="px-4">
        <FundingBanner />
      </div>
      <Composer value={input} onChange={setInput} onSend={onSend} disabled={status !== 'ready'} />
    </div>
  );
}
