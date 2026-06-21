/**
 * OpenProtocol — landing "built to outlast the app" section.
 * Server component (no hooks, no chain calls). Mirrors Landing.dc.html ~132-149.
 * One agent + sign-it-yourself receipts, reachable from terminal, any AI client, or the web app.
 */

type Surface = {
  glyph: string;
  title: string;
  tag: string;
};

const SURFACES: Surface[] = [
  { glyph: '›_', title: 'From your terminal', tag: 'CLI agent' },
  { glyph: '{}', title: 'In any AI client', tag: 'tool calls' },
  { glyph: '◆', title: 'Here, in DeepBookie', tag: 'this app' },
];

export function OpenProtocol() {
  return (
    <section className="bg-paper border-t border-[#DED9CF]">
      <div className="mx-auto max-w-[1180px] px-6 py-16 sm:px-10 sm:py-[84px]">
        <div className="flex flex-wrap items-start gap-12 lg:gap-16">
          {/* Copy column */}
          <div className="min-w-0 flex-[1_1_380px] max-w-[520px]">
            <div className="font-mono mb-[22px] text-[11px] uppercase tracking-[0.12em] text-muted">
              One agent, anywhere you trade
            </div>
            <h2 className="m-0 mb-5 text-[32px] font-bold leading-[1.04] tracking-[-0.035em] sm:text-[40px]">
              Same chat. Web, terminal, or your AI client.
            </h2>
            <p className="m-0 text-[16px] leading-[1.55] text-[#615c53] sm:text-[17px]">
              DeepBookie runs on DeepBook — both Predict (BTC prediction markets) and Spot (the
              order book). The same chat works from your terminal, any AI client, or right here.
              Your positions live on-chain, not in our database.
            </p>
          </div>

          {/* Surfaces column */}
          <div className="flex min-w-[280px] flex-[1_1_320px] flex-col">
            {SURFACES.map((s, i) => (
              <div
                key={s.title}
                className={`flex items-center gap-[14px] border-t border-[#E0DBD1] py-[18px] ${
                  i === SURFACES.length - 1 ? 'border-b' : ''
                }`}
              >
                <span className="font-mono w-5 text-[12px] text-green" aria-hidden>
                  {s.glyph}
                </span>
                <span className="text-[16px] font-semibold text-ink">{s.title}</span>
                <span className="ml-auto text-[13px] text-muted">{s.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
