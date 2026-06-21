'use client';

export function Composer({
  value,
  onChange,
  onSend,
  disabled,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  /** Small muted line above the input explaining why sending is blocked (connect wallet / pending action). */
  hint?: string;
}) {
  return (
    <div className="shrink-0 border-t border-line bg-paper px-4 py-3">
      {hint && <div className="mx-auto mb-1.5 max-w-2xl px-1 text-[11.5px] text-muted">{hint}</div>}
      <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-pill border border-line-strong bg-card py-1.5 pl-4 pr-1.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask about a market, place a bet, or swap…"
          className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          aria-label="Send"
          className="flex size-8 items-center justify-center rounded-full bg-ink text-base text-paper transition disabled:opacity-40"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
