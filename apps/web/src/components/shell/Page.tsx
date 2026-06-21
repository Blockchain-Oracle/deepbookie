import type { ReactNode } from 'react';

/** Scrolling content surface for a data page — matches the design's 26×30 main padding. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto px-5 py-6 md:px-6 md:py-7 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </div>
  );
}

/** Page title block: 26px heading + muted subtitle, with an optional right-aligned action slot. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[26px] font-bold tracking-[-0.03em]">{title}</h2>
        {subtitle && <div className="mt-0.5 text-[13px] text-muted">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
