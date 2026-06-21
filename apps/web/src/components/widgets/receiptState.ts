import type { ReceiptState } from '@/components/widgets/SignReceipt';

/**
 * Shared terminal-vs-transient receipt-state derivation, used by BOTH the Predict ReceiptController
 * and the spot write cards (useSpotWriteCard). Terminal part states win over the transient local
 * 'signing' flag, so a reload/remount renders the right thing; cancellation is encoded in part.output
 * (not local state) so it survives a remount too.
 */
export function deriveReceiptState(
  part: { state?: string; output?: { status?: string } },
  localSigning: boolean,
): ReceiptState {
  const cancelled = part.state === 'output-available' && part.output?.status === 'cancelled';
  return cancelled
    ? 'cancelled'
    : part.state === 'output-available'
      ? 'signed'
      : part.state === 'output-error'
        ? 'failed'
        : localSigning
          ? 'signing'
          : part.state === 'input-streaming'
            ? 'loading'
            : 'proposed';
}
