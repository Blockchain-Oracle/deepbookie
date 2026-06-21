'use client';

import { CardNotice } from '@/components/widgets/spot/CardNotice';

/**
 * The single source of truth for the "no BalanceManager" gate every generative-input spot write card
 * renders when `!w.hasBalanceManager && !w.bmLoading`. Previously each of the five cards re-implemented
 * the same bmError → storageBlocked → !connected → else cascade, and the copy, branch order, and
 * placement had all drifted apart. This component owns the cascade once; cards only choose where it
 * sits: `inline` (a note inside a still-live card that keeps its own Cancel) or `card` (a full-card
 * takeover with its own Dismiss).
 *
 * Two invariants are load-bearing and must not regress:
 *  - `Dismiss` always calls `onDismiss` (the card's `w.cancel`) so the tool call resolves and the
 *    assistant turn never wedges with a permanently-disabled composer.
 *  - Retry appears ONLY on `bmError` (a transient resolver failure), NEVER on `storageBlocked`. A
 *    returning user whose storage is blocked has an undetectable shared BalanceManager; offering a
 *    retry/create affordance there risks nudging them into a duplicate that orphans funds.
 */

/** Just the flags this gate reads — structurally satisfied by the full `useSpotWriteCard` return. */
interface BmGateFlags {
  bmError: boolean;
  storageBlocked: boolean;
  connected: boolean;
}

/** Canonical 4-state copy. `action` is the card's verb phrase ("place maker orders", "stake DEEP",
 *  `sweep ${pool} proceeds`) woven into the connect / no-account lines; the two error lines are fixed. */
function gateCopy(w: BmGateFlags, action: string): string {
  if (w.bmError) return 'Couldn’t reach your account — retry, don’t create a new one.';
  if (w.storageBlocked) return 'Your browser is blocking storage — we can’t detect your account; don’t create a second one.';
  if (!w.connected) return `Connect your wallet first to ${action}.`;
  return `Open a DeepBook account first to ${action}.`;
}

export function NoBalanceManagerNotice({
  w,
  action,
  title,
  variant,
  onRetry,
  onDismiss,
}: {
  w: BmGateFlags;
  /** Verb phrase woven into the connect / no-account copy, e.g. "modify orders". */
  action: string;
  /** Eyebrow for the `card` variant (ignored by `inline`). */
  title?: string;
  variant: 'inline' | 'card';
  /** Re-runs the BM resolver. Shown only on `bmError`. */
  onRetry: () => void;
  /** Resolves the tool call (the card's `w.cancel`). Rendered only by the `card` variant — `inline`
   *  hosts keep their own Cancel button. */
  onDismiss: () => void;
}) {
  const copy = gateCopy(w, action);
  const showRetry = w.bmError; // ONLY on a resolver error — never storageBlocked (duplicate-BM guard).

  if (variant === 'inline') {
    return (
      <div className="mb-[11px] rounded-[8px] border border-[#E6C9BE] bg-[#FBF1EC] px-3 py-2 text-[11.5px] font-medium text-[#8a2f1c]">
        {copy}
        {showRetry && (
          <button type="button" onClick={onRetry} className="ml-1.5 font-semibold underline underline-offset-2">
            Retry
          </button>
        )}
      </div>
    );
  }

  return <CardNotice title={title} text={copy} onRetry={showRetry ? onRetry : undefined} onDismiss={onDismiss} />;
}
