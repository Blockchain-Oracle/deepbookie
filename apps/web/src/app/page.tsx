import { BrandMark } from '@/components/ui/BrandMark';

/** Placeholder splash — the real landing ships in Phase 7. Confirms tokens + fonts render. */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex items-center gap-3">
        <BrandMark size={40} />
        <span className="text-2xl font-bold tracking-[-0.03em]">DeepBookie</span>
        <span className="rounded-card-in border border-line-strong px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-muted">
          SUI TESTNET
        </span>
      </div>
      <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.02] tracking-[-0.04em]">
        The agent proposes. You sign.
        <br />
        <span className="text-green">It holds no key.</span>
      </h1>
      <p className="mt-5 max-w-md text-lg text-ink-soft">
        Talk to an AI that prices short-term price bets off a live volatility model — you authorize
        every one yourself.
      </p>
      <p className="mt-10 font-mono text-xs uppercase tracking-[0.1em] text-faint">
        Foundation ready · building the app
      </p>
    </main>
  );
}
