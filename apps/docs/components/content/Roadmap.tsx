/**
 * The Milestones page visualization — three phases (Now / Next / Later) as a journal-style
 * gallery. Shipped items wear a green wax seal (mirrors the SignReceipt stamp); in-progress
 * items get a pulsing dot; later items get a faint outline. Responsive: 1-col mobile, 3-col lg.
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

const STATUS_DOT: Record<Status, string> = {
  shipped: 'bg-[#2C5E4A]',
  building: 'bg-[#4DA2FF]',
  later: 'bg-[#c2bcb0]',
};

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

export function Roadmap({ phases }: { phases: Phase[] }) {
  return (
    <div className="not-prose my-8 grid gap-5 lg:grid-cols-3">
      {phases.map((p) => (
        <PhaseColumn key={p.label} phase={p} />
      ))}
    </div>
  );
}

function PhaseColumn({ phase }: { phase: Phase }) {
  const { status } = phase;
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between border-b border-[#E6E1D8] pb-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className={`size-2 rounded-full ${STATUS_DOT[status]} ${status === 'building' ? 'animate-pulse' : ''}`}
            aria-hidden
          />
          <span className="text-[15px] font-bold tracking-[-0.02em] text-[#1A1714]">{phase.label}</span>
        </div>
        <span className={`rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.13em] ${STATUS_PILL[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </header>
      <p className="text-[12.5px] text-[#7d7870]">{phase.subtitle}</p>
      <ul className="flex flex-col gap-2.5">
        {phase.items.map((m) => (
          <MilestoneCard key={m.title} milestone={m} status={status} />
        ))}
      </ul>
    </section>
  );
}

function MilestoneCard({ milestone, status }: { milestone: Milestone; status: Status }) {
  return (
    <li
      className={`group flex items-start gap-3 rounded-[12px] border bg-white p-3 transition ${
        status === 'later'
          ? 'border-dashed border-[#E6E1D8]'
          : 'border-[#E6E1D8] hover:border-[#1A1714] hover:shadow-[0_8px_20px_-12px_rgb(26_23_20/0.3)]'
      }`}
    >
      <StatusIcon status={status} />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold tracking-[-0.01em] text-[#1A1714]">{milestone.title}</div>
        <div className="mt-0.5 text-[11.5px] leading-[1.45] text-[#7d7870]">{milestone.body}</div>
      </div>
    </li>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === 'shipped') {
    return (
      <span
        className="grid size-6 shrink-0 place-items-center rounded-full bg-[#2C5E4A]/12 text-[#2C5E4A] ring-1 ring-[#2C5E4A]/25"
        aria-label="Shipped"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (status === 'building') {
    return (
      <span className="grid size-6 shrink-0 place-items-center" aria-label="Building">
        <span className="size-2 animate-pulse rounded-full bg-[#4DA2FF]" />
      </span>
    );
  }
  return (
    <span className="grid size-6 shrink-0 place-items-center" aria-label="Planned">
      <span className="size-1.5 rounded-full bg-[#c2bcb0]" />
    </span>
  );
}
