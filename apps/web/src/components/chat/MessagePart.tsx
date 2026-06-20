'use client';

import type { UIMessage } from 'ai';

type Part = UIMessage['parts'][number];

interface ToolPartView {
  type: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

/**
 * Renders one message part. Text → chat bubble; tool calls → widgets. This Phase-4a version uses a
 * clean placeholder card for tool parts; the design-faithful widgets (odds curve, receipt, …) and
 * the sign handshake replace it next.
 */
export function MessagePart({ role, part }: { role: string; part: Part }) {
  if (part.type === 'text') {
    if (role === 'user') {
      return (
        <div className="ml-auto w-fit max-w-[82%] rounded-[16px_16px_5px_16px] bg-ink px-4 py-2.5 text-sm leading-snug text-paper">
          {part.text}
        </div>
      );
    }
    return <div className="max-w-[92%] text-sm leading-relaxed text-ink-soft">{part.text}</div>;
  }

  if (part.type.startsWith('tool-')) {
    const tp = part as ToolPartView;
    const name = tp.type.slice('tool-'.length);
    return (
      <div className="rounded-card border border-line bg-card p-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
          {name} · {tp.state}
        </div>
        {tp.errorText ? (
          <div className="mt-1 text-xs text-clay">{tp.errorText}</div>
        ) : tp.output != null ? (
          <pre className="mt-1 max-h-48 overflow-auto text-[11px] leading-snug text-ink-soft">
            {JSON.stringify(tp.output, null, 2).slice(0, 800)}
          </pre>
        ) : null}
      </div>
    );
  }

  return null;
}
