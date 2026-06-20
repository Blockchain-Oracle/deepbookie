'use client';

import Link from 'next/link';
import { TileIcon } from './tileIcons';
import type { Category } from './categories';

const TILE =
  'mtile group flex flex-col rounded-[13px] border bg-card p-[12px_13px] text-left transition-[transform,border-color,box-shadow] duration-150 hover:border-ink hover:shadow-[0_8px_20px_-12px_rgb(26_23_20/0.3)] active:scale-[0.975]';
const CURVE = 'M2 30 C30 28 48 14 72 16 C100 18 120 6 150 8 C170 9 186 5 198 4';

/** Mobile launcher tile. `hero` = the promoted Markets & odds card (curve + 62%); `tile` = a compact
 *  icon + title + terse description. Navigates (History) or sends its prompt; disabled → connect. */
export function CategoryTile({
  category,
  variant,
  disabled,
  onAction,
  onNeedWallet,
}: {
  category: Category;
  variant: 'hero' | 'tile';
  disabled: boolean;
  onAction: (text: string) => void;
  onNeedWallet: () => void;
}) {
  const inner = variant === 'hero' ? <Hero category={category} /> : <Compact category={category} dim={disabled} />;
  const cls = `${TILE} ${variant === 'hero' ? 'border-[#C9D8CF]' : 'border-line'} ${disabled ? 'cursor-pointer bg-[#FBFAF7]' : 'cursor-pointer'}`;

  if (disabled) {
    return (
      <button type="button" onClick={onNeedWallet} className={cls}>
        {inner}
      </button>
    );
  }
  if (category.href) {
    return (
      <Link href={category.href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => onAction(category.prompt!)} className={cls}>
      {inner}
    </button>
  );
}

function Hero({ category }: { category: Category }) {
  return (
    <>
      <div className="mb-[9px] flex items-center justify-between">
        <span className="flex items-center gap-2">
          <TileIcon kind={category.motif} />
          <span className="text-[14.5px] font-bold tracking-[-0.02em]">{category.title}</span>
        </span>
        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-green">
          <span className="live-dot size-1.5 rounded-full bg-green" />
          LIVE
        </span>
      </div>
      <div className="flex items-end gap-3">
        <div className="relative h-[38px] flex-1">
          <svg viewBox="0 0 200 40" width="100%" height="38" preserveAspectRatio="none">
            <path d={`${CURVE} L198 40 L2 40 Z`} fill="#2C5E4A" opacity="0.07" />
            <path d={CURVE} fill="none" stroke="#2C5E4A" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-none text-right">
          <div className="font-mono text-[24px] font-semibold leading-none tracking-[-0.02em] text-green">62%</div>
          <div className="mt-[3px] text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">UP · 4:00pm</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 rounded-[8px] border border-[#EDE9E0] bg-[#F6F4EF] px-2.5 py-[7px] font-mono text-[10.5px] text-ink-soft">
        <span className="min-w-0 flex-1 truncate">&ldquo;{category.prompt}&rdquo;</span>
        <span className="ml-auto flex-none">→</span>
      </div>
    </>
  );
}

function Compact({ category, dim }: { category: Category; dim?: boolean }) {
  return (
    <div className={dim ? 'opacity-60' : ''}>
      <div className="flex items-center justify-between">
        <TileIcon kind={category.motif} />
        <span className="flex-none text-[14px] leading-none text-[#c2bcb0] transition-transform duration-150 group-active:translate-x-0.5">→</span>
      </div>
      <div className="mb-0.5 mt-[9px] text-[13px] font-bold tracking-[-0.01em]">{category.title}</div>
      <div className="text-[10.5px] leading-[1.3] text-muted">{category.mobileDesc}</div>
    </div>
  );
}
