/**
 * TrustBand — the dark non-custodial guarantee band.
 * Server component: static, provider-free, no hooks. Matches Landing.dc.html (~lines 55-80).
 * Dark-band-specific hexes (#7d8a82 muted-teal eyebrow, #cfc9bd soft body, #2c2823 divider,
 * #a8a298 step body) have no design token, so they're set via arbitrary values.
 */

interface TrustStep {
  n: string;
  title: string;
  body: string;
}

const STEPS: readonly TrustStep[] = [
  {
    n: '01',
    title: 'It proposes',
    body: 'A clickable odds curve and an itemized receipt — never an executed trade.',
  },
  {
    n: '02',
    title: 'You sign',
    body: "Your wallet opens. You see the exact amounts and approve — or don't.",
  },
  {
    n: '03',
    title: 'You get a receipt',
    body: 'A signed confirmation with the on-chain digest, verifiable on Suiscan.',
  },
];

export function TrustBand() {
  return (
    <section aria-label="Non-custodial trust" className="bg-ink text-paper">
      <div className="mx-auto max-w-[1180px] px-6 py-20 sm:px-10 sm:py-24">
        <div className="mb-7 font-mono text-[11px] uppercase tracking-[0.14em] text-[#7d8a82]">
          The trust story
        </div>
        <div className="flex flex-wrap items-start gap-x-16 gap-y-12">
          <h2 className="m-0 flex-[1_1_420px] text-[40px] font-extrabold leading-[1.0] tracking-[-0.04em] sm:text-[52px]">
            The agent is smart,
            <br />
            but <span className="text-mint">powerless</span>.
          </h2>
          <div className="flex-[1_1_360px] sm:max-w-[460px]">
            <p className="m-0 mb-7 text-[17px] leading-[1.55] text-[#cfc9bd] sm:text-[18px]">
              It can read the market and propose a trade — but it can&apos;t move a cent. Every
              action is a request you approve in your own wallet, seeing exactly what you sign. No
              key. No custody. No surprises.
            </p>
            <ol className="m-0 flex list-none flex-col gap-0 p-0">
              {STEPS.map((step, i) => (
                <li
                  key={step.n}
                  className={`flex gap-4 border-t border-[#2c2823] py-4 ${
                    i === STEPS.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <span className="w-7 flex-none font-mono text-xs text-[#7d8a82] tabular-nums">
                    {step.n}
                  </span>
                  <div>
                    <div className="mb-[3px] text-base font-semibold">{step.title}</div>
                    <div className="text-sm leading-[1.5] text-[#a8a298]">{step.body}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
