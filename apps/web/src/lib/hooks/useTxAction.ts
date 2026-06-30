'use client';

import { useCallback, useRef, useState } from 'react';
import { useSubmitTx } from './useSubmitTx';
import { diagnose, isUserRejection, type Diagnosis } from '@/lib/diagnose';

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
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  // Synchronous re-entry guard — `status` only flips to 'signing' on the next render, so a fast
  // double-click before that could fire two submits. This blocks the second immediately.
  const inFlight = useRef(false);

  const run = useCallback(
    async (
      tool: string,
      input: Record<string, unknown>,
      ids?: { managerId?: string; balanceManagerId?: string },
    ): Promise<string | null> => {
      if (inFlight.current) return null;
      inFlight.current = true;
      setStatus('signing');
      setReason(null);
      setDiagnosis(null);
      try {
        const d = await submit(tool, input, ids);
        setDigest(d);
        setStatus('done');
        return d;
      } catch (e) {
        // A wallet decline is a cancellation, not a failure — reset to idle (don't show error styling).
        if (isUserRejection(e)) {
          setStatus('idle');
          return null;
        }
        const d = diagnose(e);
        setDiagnosis(d);
        setReason(d.headline);
        setStatus('error');
        return null;
      } finally {
        inFlight.current = false;
      }
    },
    [submit],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setReason(null);
    setDiagnosis(null);
  }, []);

  return { status, digest, reason, diagnosis, run, reset };
}
