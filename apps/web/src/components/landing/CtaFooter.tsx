import Link from 'next/link';
import { BrandMark } from '@/components/ui/BrandMark';

/** Footer nav labels, verbatim from the design — no invented external links. */
const FOOTER_LINKS = ['How it works', 'The model', 'Markets', 'Docs', 'GitHub'] as const;

/**
 * Final CTA + footer for the marketing landing.
 * Dark band: closing headline, sub-copy, "Launch app" → /chat, "Read the docs",
 * then a footer row with the brand mark, the SUI TESTNET tag, nav, and a status note.
 * Server component — static, no interaction.
 */
export function CtaFooter() {
  return (
    <section data-screen-label="Landing — CTA & footer" className="bg-ink text-paper">
      <div className="mx-auto max-w-[1180px] px-6 pb-10 pt-20 sm:px-10 sm:pt-24">
        <div className="mx-auto mb-16 max-w-[680px] text-center sm:mb-20">
          <h2 className="m-0 text-[40px] font-extrabold leading-[1.0] tracking-[-0.04em] sm:text-[54px]">
            The agent proposes.
            <br />
            You sign.
          </h2>
          <p className="m-0 mx-auto mt-[22px] max-w-[560px] text-[17px] leading-[1.5] text-[#cfc9bd] sm:text-[18px]">
            Connect a Sui wallet, grab some test dUSDC, and place your first bet in under a minute.
          </p>
          <div className="mt-[34px] flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/chat"
              className="rounded-card-in bg-paper px-[30px] py-[15px] text-[16px] font-semibold text-ink transition-colors hover:bg-white"
            >
              Launch app →
            </Link>
            <a
              href="#how-it-works"
              className="border-b-[1.5px] border-[#5c574e] px-2 py-[15px] text-[16px] font-semibold text-paper transition-colors hover:border-paper"
            >
              Read the docs
            </a>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-[#2c2823] pt-7">
          <div className="flex items-center gap-[11px]">
            <BrandMark size={16} />
            <span className="text-[16px] font-bold tracking-[-0.03em]">DeepBookie</span>
            <span className="ml-[6px] rounded-[4px] border border-[#2c2823] px-[7px] py-1 font-mono text-[10px] tracking-[0.08em] text-[#7d8a82]">
              SUI TESTNET
            </span>
          </div>

          <nav className="flex flex-wrap gap-7 text-[14px] text-[#a8a298]">
            {FOOTER_LINKS.map((label) => (
              <a
                key={label}
                href="#"
                className="transition-colors hover:text-paper"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="font-mono text-[11px] text-[#6b675e]">non-custodial · open protocol</div>
        </footer>
      </div>
    </section>
  );
}
