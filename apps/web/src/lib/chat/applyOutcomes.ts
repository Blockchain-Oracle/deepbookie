import type { UIMessage } from 'ai';
import type { TxOutcomeRow } from '@/lib/db/schema';

/**
 * Overlay the authoritative sign outcomes (ledger) onto a saved transcript before replay, so a receipt
 * shows SIGNED + digest even if the transcript blob didn't capture it (tab closed on sign). Merges the
 * digest into the persisted output so a card's edited figures survive. Shared by History + the in-chat
 * archived-session view.
 */
export function applyOutcomes(messages: UIMessage[], outcomes: TxOutcomeRow[]): UIMessage[] {
  if (!outcomes?.length) return messages;
  const byId = new Map(outcomes.map((o) => [o.toolCallId, o]));
  return messages.map((m) => ({
    ...m,
    parts: m.parts.map((p) => {
      const part = p as Record<string, unknown> & { toolCallId?: string };
      const o = part.toolCallId ? byId.get(part.toolCallId) : undefined;
      if (!o) return p;
      if (o.status === 'signed')
        return { ...part, state: 'output-available', output: { ...(part.output as Record<string, unknown> | undefined), digest: o.digest } };
      if (o.status === 'cancelled') return { ...part, state: 'output-available', output: { status: 'cancelled' } };
      return { ...part, state: 'output-error', errorText: 'The transaction failed.' };
    }) as UIMessage['parts'],
  }));
}
