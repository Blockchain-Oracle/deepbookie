'use client';

import { useState } from 'react';

/** A tool tile that copies its name to the clipboard on click (with a brief "Copied" confirmation). */
export function ToolRow({ name, desc, kind }: { name: string; desc: string; kind: 'read' | 'write' }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(name);
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
      className="group block w-full rounded-card border border-line bg-card p-3.5 text-left transition hover:border-ink hover:shadow-[var(--shadow-raised)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[13px] font-semibold">{name}</span>
        <span
          className={`shrink-0 rounded-pill border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${
            kind === 'read' ? 'border-line-strong text-muted' : 'border-green text-green'
          }`}
        >
          {kind === 'read' ? 'read' : 'you sign'}
        </span>
      </div>
      <p className="mt-1 text-[12.5px] leading-snug text-muted">{desc}</p>
      <span className={`mt-2 inline-block font-mono text-[10.5px] transition-colors ${copied ? 'text-green' : 'text-faint group-hover:text-ink'}`}>
        {copied ? 'Copied ✓' : 'click to copy'}
      </span>
    </button>
  );
}
