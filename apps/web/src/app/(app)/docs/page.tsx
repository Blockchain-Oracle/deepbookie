import { allTools } from '@deepbookie/core';
import { Page, PageHeader } from '@/components/shell/Page';
import { Card } from '@/components/ui/Card';

// Keeper tool — not user-facing, hidden from the catalog (matches the agent's excluded set).
const HIDDEN = new Set(['redeem_permissionless']);

const CATEGORIES: { title: string; blurb: string; tools: string[] }[] = [
  {
    title: 'Markets & odds',
    blurb: 'Live markets, the probability curve, and exact quotes.',
    tools: ['list_markets', 'get_market', 'get_odds', 'get_quote', 'get_range_quote', 'get_recent_bets'],
  },
  {
    title: 'Trading',
    blurb: 'Buy and settle binary and range positions — you sign each one.',
    tools: ['mint', 'redeem', 'mint_range', 'redeem_range'],
  },
  {
    title: 'Your account',
    blurb: 'Create your manager, then read balance, PnL, and positions.',
    tools: ['create_manager', 'get_portfolio', 'get_positions'],
  },
  {
    title: 'Vault & liquidity',
    blurb: 'Provide liquidity to the PLP pool and track its performance.',
    tools: ['get_vault', 'get_vault_history', 'supply', 'withdraw'],
  },
];

/** Tool catalog — generated from the live core registry so it can never drift from what ships. */
export default function DocsPage() {
  const byName = new Map(allTools.filter((t) => !HIDDEN.has(t.name)).map((t) => [t.name, t]));
  const categorized = new Set(CATEGORIES.flatMap((c) => c.tools));
  const other = [...byName.values()].filter((t) => !categorized.has(t.name)).map((t) => t.name);
  const sections = other.length ? [...CATEGORIES, { title: 'Other', blurb: '', tools: other }] : CATEGORIES;

  return (
    <Page>
      <PageHeader
        title="What DeepBookie can do"
        subtitle={`${byName.size} tools the agent can call — ask in plain English; you sign every write yourself`}
      />
      <div className="flex flex-col gap-6">
        {sections.map((cat) => (
          <section key={cat.title}>
            <div className="mb-0.5 flex items-baseline justify-between">
              <h3 className="text-[15px] font-bold">{cat.title}</h3>
              <span className="font-mono text-[10.5px] text-faint">{cat.tools.length} tools</span>
            </div>
            {cat.blurb && <p className="mb-2.5 text-[12.5px] text-muted">{cat.blurb}</p>}
            <div className="grid gap-2.5 sm:grid-cols-2">
              {cat.tools.map((name) => {
                const t = byName.get(name);
                if (!t) return null;
                return <ToolRow key={name} name={name} desc={t.description} kind={t.kind} />;
              })}
            </div>
          </section>
        ))}
      </div>
    </Page>
  );
}

function ToolRow({ name, desc, kind }: { name: string; desc: string; kind: 'read' | 'write' }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[13px] font-semibold">{name}</span>
        <span
          className={`shrink-0 rounded-pill border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${
            kind === 'read' ? 'border-line-strong text-muted' : 'border-green text-green'
          }`}
        >
          {kind === 'read' ? 'read' : 'you sign'}
        </span>
      </div>
      <p className="mt-1 text-[12.5px] leading-snug text-muted">{desc}</p>
    </Card>
  );
}
