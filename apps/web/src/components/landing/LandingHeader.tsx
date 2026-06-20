import Link from 'next/link';
import { BrandMark } from '@/components/ui/BrandMark';
import { DOCS_URL } from '@/lib/constants';

/**
 * Landing top header — brand mark + the primary links. Points to the external documentation
 * (docs.deepbookie.xyz) and the app. Sticky so the CTA + docs are always reachable while scrolling.
 */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={18} className="block flex-none" />
          <span className="text-[17px] font-bold tracking-[-0.03em] text-ink">DeepBookie</span>
          <span className="ml-0.5 hidden rounded-card-in border border-line-strong px-[7px] py-0.5 font-mono text-[9.5px] tracking-[0.08em] text-muted sm:inline-block">
            TESTNET
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href="#how"
            className="hidden rounded-card-in px-3 py-2 text-[14px] font-medium text-ink-soft transition-colors hover:text-ink sm:inline-block"
          >
            How it works
          </a>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-card-in px-3 py-2 text-[14px] font-medium text-ink-soft transition-colors hover:text-ink"
          >
            Documentation <span aria-hidden>↗</span>
          </a>
          <Link
            href="/chat"
            className="rounded-card-in bg-ink px-4 py-2 text-[14px] font-semibold text-paper transition-colors hover:bg-[#2a2620]"
          >
            Launch app →
          </Link>
        </nav>
      </div>
    </header>
  );
}
