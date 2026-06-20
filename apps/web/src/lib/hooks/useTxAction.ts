'use client';

import { useCallback, useState } from 'react';
import { reasonFor, useSubmitTx } from './useSubmitTx';

export type TxStatus = 'idle' | 'signing' | 'done' | 'error';

/**
 * Page-side wrapper around the keyless {@link useSubmitTx} handshake that tracks the terminal
 * sign state (idle → signing → done/error) for buttons outside the chat (redeem / supply /
 * withdraw). Mirrors the receipt state machine, minus the streamed proposal step.
 */
export function useTxAction() {
  const submit = useSubmitTx();
  const [status, setStatus] = useState<TxStatus>('idle');
  const [digest, setDigest] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  const run = useCallback(
    async (tool: string, input: Record<string, unknown>, managerId?: string): Promise<string | null> => {
      setStatus('signing');
      setReason(null);
      try {
        const d = await submit(tool, input, managerId);
        setDigest(d);
        setStatus('done');
        return d;
      } catch (e) {
        setReason(reasonFor(e));
        setStatus('error');
        return null;
      }
    },
    [submit],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setReason(null);
  }, []);

  return { status, digest, reason, run, reset };
}
