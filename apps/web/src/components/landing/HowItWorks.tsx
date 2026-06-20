const STEPS = [
  {
    n: '01',
    title: 'Ask in plain language',
    body: '“Will BTC be above $63k in the next half hour?” The agent reads the live market and reasons about the right bet.',
  },
  {
    n: '02',
    title: 'See the real odds',
    body: 'A live probability curve — P(price ≥ strike) across every strike, priced off an on-chain volatility model. Tap a strike.',
  },
  {
    n: '03',
    title: 'Sign it yourself',
    body: 'The agent proposes an itemized receipt. You authorize it in your own wallet, get an on-chain digest, and keep custody throughout.',
  },
] as const;

/**
 * Landing — "How it works" 3-step section.
 * Server component (no interactivity). Mirrors Landing.dc.html ~lines 28-54.
 * `id="how"` is the hero anchor target.
 */
export function HowItWorks() {
  return (
    <section
      id="how"
      aria-labelledby="how-heading"
      className="border-t border-line-strong bg-paper"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-16 sm:px-10 sm:py-[84px]">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <h2
            id="how-heading"
            className="m-0 max-w-[620px] text-3xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-[40px]"
          >
            Ask a question. Read the odds. Sign it yourself.
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
            3 steps · one signature
          </span>
        </div>

        <ol className="m-0 flex list-none flex-wrap border-t border-[#E0DBD1] p-0">
          {STEPS.map((step, i) => (
            <li
              key={step.n}
              className={[
                'flex-[1_1_280px] py-8',
                // Inner gutters/dividers match the design's three-up rhythm,
                // collapsing cleanly when the row wraps to a single column.
                i === 0
                  ? 'pr-0 sm:pr-9 lg:border-r lg:border-[#E0DBD1]'
                  : i === STEPS.length - 1
                    ? 'sm:pl-9'
                    : 'sm:px-9 lg:border-r lg:border-[#E0DBD1]',
              ].join(' ')}
            >
              <div className="mb-[18px] font-mono text-[13px] text-[#b0aa9f]">
                {step.n}
              </div>
              <h3 className="mb-[9px] text-[21px] font-bold leading-tight tracking-[-0.02em]">
                {step.title}
              </h3>
              <p className="m-0 text-[15px] leading-[1.55] text-[#6f6a60]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
