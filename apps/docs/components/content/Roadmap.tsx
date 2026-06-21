/**
 * Milestones page — one flowing column, full width. Each phase is a section with a bold header
 * (label + status), then the milestones underneath as wide rows (no cards, no grid). Reads like
 * a release log: title + description per row, generous spacing, subtle dividers.
 */

type Status = 'shipped' | 'building' | 'later';

export interface Milestone {
  title: string;
  body: string;
}

export interface Phase {
  label: string;
  subtitle: string;
  status: Status;
  items: Milestone[];
}

const STATUS_PILL: Record<Status, string> = {
  shipped: 'bg-[#2C5E4A]/10 text-[#2C5E4A] border-[#2C5E4A]/25',
  building: 'bg-[#4DA2FF]/10 text-[#4DA2FF] border-[#4DA2FF]/25',
  later: 'bg-[#FBFAF7] text-[#7d7870] border-[#E6E1D8]',
};

const STATUS_LABEL: Record<Status, string> = {
  shipped: 'Shipped',
  building: 'Building',
  later: 'Roadmap',
};

const STATUS_DOT: Record<Status, string> = {
  shipped: 'bg-[#2C5E4A]',
  building: 'bg-[#4DA2FF]',
  later: 'bg-transparent ring-1 ring-[#c2bcb0]',
};

export function Roadmap({ phases }: { phases: Phase[] }) {
  return (
    <div className="not-prose my-10 flex flex-col gap-14">
      {phases.map((p) => (
        <PhaseSection key={p.label} phase={p} />
      ))}
    </div>
  );
}

function PhaseSection({ phase }: { phase: Phase }) {
  return (
    <section>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-[#E0DBD1] pb-3.5">
        <div className="flex items-baseline gap-3">
          <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em] text-[#1A1714] sm:text-[30px]">
            {phase.label}
          </h2>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.13em] text-[#928d83]">
            {phase.subtitle}
          </span>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.13em] ${STATUS_PILL[phase.status]}`}
        >
          {STATUS_LABEL[phase.status]}
        </span>
      </header>

      <div className="flex flex-col">
        {phase.items.map((m, i) => (
          <article
            key={m.title}
            className={`flex items-start gap-5 py-5 ${
              i > 0 ? 'border-t border-[#EDE9E0]' : ''
            }`}
          >
            <span
              aria-hidden
              className={`mt-2 size-2 shrink-0 rounded-full ${STATUS_DOT[phase.status]} ${
                phase.status === 'building' ? 'animate-pulse' : ''
              }`}
            />
            <div className="min-w-0 flex-1">
              <h3 className="m-0 text-[18px] font-bold leading-snug tracking-[-0.02em] text-[#1A1714] sm:text-[20px]">
                {m.title}
              </h3>
              <p className="m-0 mt-1.5 max-w-[680px] text-[14.5px] leading-[1.6] text-[#615c53]">
                {m.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
