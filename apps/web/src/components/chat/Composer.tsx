'use client';

export function Composer({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <div className="shrink-0 border-t border-line bg-paper px-4 py-3">
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
          placeholder="Ask about a market, or place a bet…"
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
