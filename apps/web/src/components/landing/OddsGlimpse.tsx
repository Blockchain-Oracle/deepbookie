import { OddsCurveCard } from '@/components/widgets/OddsCurveCard';
import type { Odds } from '@/lib/bff/types';

// A plausible testnet BTC binary round: spot ~$63.4k, ~27 minutes to expiry.
// P(up) decreases as the strike rises — the curve the agent prices off a live
// volatility model on DeepBook Predict. Static sample; no hooks, no chain calls.
const SPOT = 63_422.99;
const FORWARD = 63_468.0;
const EXPIRY_MS = 27 * 60 * 1000; // 27 minutes ahead → renders "live · 27m left"

const SAMPLE_ODDS: Odds = {
  oracleId: 'BTC',
  expiry: Date.now() + EXPIRY_MS,
  spot: SPOT,
  forward: FORWARD,
  atmProbabilityUp: 0.512,
  curve: [
    { strike: 60_000, probabilityUp: 0.83 },
    { strike: 61_000, probabilityUp: 0.748 },
    { strike: 62_000, probabilityUp: 0.642 },
    { strike: 63_000, probabilityUp: 0.538 },
    { strike: 63_422, probabilityUp: 0.494 },
    { strike: 64_000, probabilityUp: 0.418 },
    { strike: 65_000, probabilityUp: 0.296 },
    { strike: 66_000, probabilityUp: 0.196 },
  ],
};

const STATS = [
  { label: 'Underlying', value: 'BTC · binary' },
  { label: 'Refresh', value: '~3s', mono: true },
];

export function OddsGlimpse() {
  return (
    <section className="bg-[#EDEAE3]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-12 px-6 py-16 sm:px-10 lg:gap-16 lg:py-[90px]">
        <div className="max-w-[440px] flex-[1_1_360px]">
          <div className="mb-[22px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            Real odds, not vibes
          </div>
          <h2 className="m-0 text-[34px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[42px]">
            Priced on-chain, updated every few seconds.
          </h2>
          <p className="mb-7 mt-[22px] text-[17px] leading-[1.55] text-[#615c53]">
            The curve is the probability of finishing above each strike, derived
            from a live volatility model on DeepBook Predict. It moves with the
            market — so the odds you sign are the odds right now.
          </p>
          <div className="flex gap-9">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">
                  {s.label}
                </div>
                <div
                  className={`mt-1 text-[22px] font-bold ${
                    s.mono ? 'font-mono tabular-nums' : ''
                  }`}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-[1_1_440px]">
          <OddsCurveCard status="live" odds={SAMPLE_ODDS} asset="BTC" strikeUsd={63_000} />
        </div>
      </div>
    </section>
  );
}
