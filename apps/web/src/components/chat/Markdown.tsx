'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Styled to our tokens; figures use tabular-nums. Raw HTML is not rendered (react-markdown default).
const components: Components = {
  p: ({ node: _node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
  ul: ({ node: _node, ...props }) => <ul className="mb-2 list-disc space-y-0.5 pl-5 last:mb-0" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="mb-2 list-decimal space-y-0.5 pl-5 last:mb-0" {...props} />,
  li: ({ node: _node, ...props }) => <li className="leading-relaxed" {...props} />,
  strong: ({ node: _node, ...props }) => <strong className="font-semibold text-ink" {...props} />,
  em: ({ node: _node, ...props }) => <em className="italic" {...props} />,
  a: ({ node: _node, ...props }) => (
    <a className="font-medium text-green underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />
  ),
  code: ({ node: _node, ...props }) => (
    <code className="rounded bg-paper px-1 py-0.5 font-mono text-[12px] tabular-nums" {...props} />
  ),
  pre: ({ node: _node, ...props }) => (
    <pre className="mb-2 overflow-x-auto rounded-card-in bg-paper p-3 font-mono text-[12px] last:mb-0" {...props} />
  ),
  h1: ({ node: _node, ...props }) => <h3 className="mb-1 mt-1 text-[15px] font-bold first:mt-0" {...props} />,
  h2: ({ node: _node, ...props }) => <h3 className="mb-1 mt-1 text-[14px] font-bold first:mt-0" {...props} />,
  h3: ({ node: _node, ...props }) => <h4 className="mb-1 mt-1 text-[13px] font-bold first:mt-0" {...props} />,
  table: ({ node: _node, ...props }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-[12px]" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }) => <th className="border border-line px-2 py-1 text-left font-semibold" {...props} />,
  td: ({ node: _node, ...props }) => <td className="border border-line px-2 py-1 tabular-nums" {...props} />,
  blockquote: ({ node: _node, ...props }) => (
    <blockquote className="mb-2 border-l-2 border-line-strong pl-3 text-muted last:mb-0" {...props} />
  ),
};

/** Renders assistant chat text as GitHub-flavored markdown, themed to DeepBookie. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
