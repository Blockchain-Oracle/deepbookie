import Link from 'next/link';

/**
 * Hero — the landing page's left text column. Server component (no interactivity).
 * The brand mark lives in the LandingHeader; the animated DemoPhone is placed beside this by the page.
 * Mirrors Demo.dc.html lines 32-49 (copy, type scale, spacing).
 */
export function Hero() {
  return (
    <div className="min-w-0 flex-1 basis-[440px] lg:min-w-[360px]">
      {/* Eyebrow kicker */}
      <div className="mb-[22px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        DeepBook Predict — live on Sui
      </div>

      {/* Headline */}
      <h1 className="mb-[26px] text-[44px] font-extrabold leading-[0.96] tracking-[-0.045em] text-ink sm:text-[54px] lg:text-[62px]">
        The agent proposes.
        <br />
        You sign.
        <br />
        <span className="font-medium text-faint">It holds no key.</span>
      </h1>

      {/* Sub-paragraph */}
      <p className="mb-[34px] max-w-[440px] text-[17px] leading-[1.5] text-ink-soft sm:text-[18px]">
        Talk to an AI that prices short-term price bets off a live volatility model. It reads the
        market and proposes the trade — you authorize every one yourself, in your own wallet.
      </p>

      {/* CTAs */}
      <div className="mb-[30px] flex flex-wrap items-center gap-4">
        <Link
          href="/chat"
          className="rounded-card-in bg-ink px-[26px] py-[14px] text-[15px] font-semibold text-paper transition-colors hover:bg-[#2a2620]"
        >
          Launch app →
        </Link>
        <a
          href="#how"
          className="border-b-[1.5px] border-ink px-2 py-[14px] text-[15px] font-semibold text-ink transition-opacity hover:opacity-70"
        >
          How it works
        </a>
      </div>

      {/* Mono trust kicker */}
      <div className="flex flex-wrap gap-4 font-mono text-[11.5px] tracking-[0.04em] text-faint">
        <span>non-custodial</span>
        <span className="text-line-strong" aria-hidden>
          ·
        </span>
        <span>you sign every trade</span>
        <span className="text-line-strong" aria-hidden>
          ·
        </span>
        <span>open protocol</span>
      </div>
    </div>
  );
}
