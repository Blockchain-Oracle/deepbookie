'use client';

import Link from 'next/link';
import { Motif } from './motifs';
import type { Category } from './categories';

const CARD =
  'group relative flex h-[188px] w-[246px] shrink-0 snap-start flex-col overflow-hidden rounded-card border bg-card px-[15px] pb-[13px] pt-[14px] text-left';
const HOVER =
  'cursor-pointer border-line transition-[transform,box-shadow,border-color] duration-200 [transition-timing-function:cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1 hover:border-ink hover:shadow-[0_10px_28px_-12px_rgb(26_23_20/0.32)] active:-translate-y-px active:scale-[0.992]';

function Header({ category, dim }: { category: Category; dim?: boolean }) {
  return (
    <div className={`mb-2 flex items-center justify-between ${dim ? 'opacity-55' : ''}`}>
      <span className="flex items-center gap-1.5">
        <span className={`size-2 rounded-full ${category.dot}`} />
        <span className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-faint">{category.familyLabel}</span>
      </span>
      {category.isLive && <span className="live-dot font-mono text-[9px] text-green">LIVE</span>}
    </div>
  );
}

function Body({ category, dim }: { category: Category; dim?: boolean }) {
  return (
    <>
      <div className={`mt-0.5 mb-[3px] text-[14.5px] font-bold tracking-[-0.02em] ${dim ? 'opacity-55' : ''}`}>{category.title}</div>
      <div className={`text-[11.5px] leading-[1.35] text-[#7d7870] ${dim ? 'opacity-55' : ''}`}>{category.description}</div>
      <div className={dim ? 'opacity-40' : ''}>
        <Motif kind={category.motif} />
      </div>
    </>
  );
}

function Prompt({ text }: { text: string }) {
  return (
    <div className="mt-auto flex items-center gap-1.5 rounded-[8px] border border-[#EDE9E0] bg-[#F6F4EF] px-2.5 py-[7px] font-mono text-[10.5px] text-ink-soft transition-[background,color,border-color] duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
      <span className="min-w-0 flex-1 truncate">&ldquo;{text}&rdquo;</span>
      <span className="ml-auto flex-none transition-transform duration-200 group-hover:translate-x-0.5">→</span>
    </div>
  );
}

/** One rail card (246×188). Sends its prompt on tap (or navigates if `href`); disabled cards prompt
 *  to connect a wallet. Hover/active are pure CSS (group-hover); sending is a brief local flash. */
export function CategoryCard({
  category,
  index,
  disabled,
  onAction,
  onNeedWallet,
}: {
  category: Category;
  index: number;
  disabled: boolean;
  onAction: (text: string) => void;
  onNeedWallet: () => void;
}) {
  const style = { animationDelay: `${0.04 + index * 0.06}s` } as const;

  if (disabled) {
    return (
      <button type="button" onClick={onNeedWallet} className={`${CARD} animate-rise cursor-pointer border-line bg-[#FBFAF7]`} style={style}>
        <Header category={category} dim />
        <Body category={category} dim />
        <div className="mt-auto flex items-center gap-[7px] rounded-[8px] border border-dashed border-[#D8CFC2] bg-[#F6F4EF] px-2.5 py-2">
          <span className="size-3.5 flex-none rounded-[4px] bg-wallet" />
          <span className="text-[11px] font-semibold text-muted">Connect wallet to use</span>
        </div>
      </button>
    );
  }

  if (category.href) {
    return (
      <Link href={category.href} className={`${CARD} ${HOVER} animate-rise`} style={style}>
        <Header category={category} />
        <Body category={category} />
        <Prompt text={category.prompt ?? category.description} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onAction(category.prompt!)}
      className={`${CARD} ${HOVER} animate-rise`}
      style={style}
    >
      <Header category={category} />
      <Body category={category} />
      <Prompt text={category.prompt!} />
    </button>
  );
}
