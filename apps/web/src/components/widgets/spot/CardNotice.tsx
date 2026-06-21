'use client';

/**
 * A quiet full-card notice: an optional eyebrow title, a body line, an optional Retry, and a Dismiss.
 * Shared chrome for the spot write cards' terminal-ish states (no-account, order-gone, read-failed) so
 * the shell lives in ONE place — NoBalanceManagerNotice's `card` variant and ModifyOrderCard both
 * render through it. `onDismiss` must resolve the tool call (the card's `w.cancel`) so the assistant
 * turn never wedges with a permanently-disabled composer.
 */
export function CardNotice({
  title,
  text,
  onRetry,
  onDismiss,
}: {
  title?: string;
  text: string;
  /** Shown only when provided (a transient/retryable cause). */
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex min-h-[120px] w-full flex-col justify-center gap-3 rounded-card border border-line bg-card p-5">
      {title && <div className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">{title}</div>}
      <div className="text-[13px] leading-[1.45] text-muted">{text}</div>
      <div className="flex gap-2.5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-[9px] border border-line-strong px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-paper"
          >
            Retry
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-[9px] border border-line-strong px-4 py-2 text-[12.5px] font-semibold text-[#7d7870] transition hover:bg-paper"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
