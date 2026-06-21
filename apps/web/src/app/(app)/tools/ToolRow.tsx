'use client';

import { useState } from 'react';

/**
 * A tool tile. Leads with a ready-to-use chat PROMPT (what you'd type) and copies THAT on click —
 * not the internal tool name (which is kept as a small dev tag for reference).
 */
export function ToolRow({
  name,
  prompt,
  desc,
  kind,
}: {
  name: string;
  prompt: string;
  desc: string;
  kind: 'read' | 'write';
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (e.g. insecure context) — no-op */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group flex w-full flex-col rounded-card border border-line bg-card p-3.5 text-left transition hover:border-ink hover:shadow-[var(--shadow-raised)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13.5px] font-semibold leading-snug text-ink">&ldquo;{prompt}&rdquo;</span>
        <span
          className={`mt-0.5 shrink-0 rounded-pill border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${
            kind === 'read' ? 'border-line-strong text-muted' : 'border-green text-green'
          }`}
        >
          {kind === 'read' ? 'read' : 'you sign'}
        </span>
      </div>
      <p className="mt-1 text-[12px] leading-snug text-muted">{desc}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-faint">{name}</span>
        <span className={`font-mono text-[10.5px] transition-colors ${copied ? 'text-green' : 'text-faint group-hover:text-ink'}`}>
          {copied ? 'Copied ✓' : 'click to copy prompt'}
        </span>
      </div>
    </button>
  );
}
