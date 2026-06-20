import Link from 'next/link';
import { allTools } from '@deepbookie/core';
import { Page, PageHeader } from '@/components/shell/Page';
import { Card } from '@/components/ui/Card';

// Keeper tool — not user-facing, hidden from the catalog (matches the agent's excluded set).
const HIDDEN = new Set(['redeem_permissionless']);

/** Each category carries a starter `prompt`; tapping any tool deep-links into chat with it. */
const CATEGORIES: { title: string; blurb: string; prompt: string; tools: string[] }[] = [
  {
    title: 'Markets & odds',
    blurb: 'Live markets, the probability curve, and exact quotes.',
    prompt: 'What are the live BTC odds?',
    tools: ['list_markets', 'get_market', 'get_odds', 'get_quote', 'get_range_quote', 'get_recent_bets'],
  },
  {
    title: 'Place a bet',
    blurb: 'Buy and settle binary and range positions — you sign each one.',
    prompt: 'Place a $5 UP bet on BTC.',
    tools: ['mint', 'redeem', 'mint_range', 'redeem_range'],
  },
  {
    title: 'Your account',
    blurb: 'Create your manager, then read balance, PnL, and positions.',
    prompt: "What's my balance and open positions?",
    tools: ['create_manager', 'get_portfolio', 'get_positions'],
  },
  {
    title: 'Vault & liquidity',
    blurb: 'Provide liquidity to the PLP pool and track its performance.',
    prompt: 'How does the vault work?',
    tools: ['get_vault', 'get_vault_history', 'supply', 'withdraw'],
  },
  {
    title: 'Swap',
    blurb: 'Swap tokens on the DeepBook V3 order book.',
    prompt: 'Swap 100 SUI to DBUSDC.',
    tools: ['spot_list_pools', 'spot_mid_price', 'spot_swap_quote', 'spot_swap_base_for_quote', 'spot_swap_quote_for_base'],
  },
  {
    title: 'Orders & liquidity',
    blurb: 'Place, modify and cancel limit/market orders (a maker order is liquidity).',
    prompt: 'Show me the SUI/DBUSDC order book.',
    tools: [
      'spot_orderbook',
      'spot_pool_params',
      'spot_open_orders',
      'spot_can_place_limit_order',
      'spot_can_place_market_order',
      'spot_place_limit_order',
      'spot_place_market_order',
      'spot_modify_order',
      'spot_cancel_order',
      'spot_cancel_all_orders',
    ],
  },
  {
    title: 'Spot account',
    blurb: 'Your DeepBook BalanceManager: deposit, withdraw, sweep settled funds.',
    prompt: 'Open my DeepBook spot account.',
    tools: ['spot_create_balance_manager', 'spot_deposit', 'spot_withdraw', 'spot_balance', 'spot_account', 'spot_withdraw_settled_amounts'],
  },
  {
    title: 'Stake DEEP',
    blurb: 'Stake DEEP for fee discounts and governance voting power.',
    prompt: 'Stake 500 DEEP in the SUI/DBUSDC pool.',
    tools: ['spot_stake', 'spot_unstake'],
  },
  {
    title: 'Governance',
    blurb: 'Propose fee changes, vote your stake, claim rebates.',
    prompt: 'Show governance for the SUI/DBUSDC pool.',
    tools: ['spot_submit_proposal', 'spot_vote', 'spot_claim_rebates'],
  },
];

/** Tool catalog — generated from the live core registry so it can never drift from what ships.
 *  Every tool tile is tappable and deep-links into chat with its category's starter prompt. */
export default function ToolsPage() {
  const byName = new Map(allTools.filter((t) => !HIDDEN.has(t.name)).map((t) => [t.name, t]));
  const categorized = new Set(CATEGORIES.flatMap((c) => c.tools));
  const other = [...byName.values()].filter((t) => !categorized.has(t.name)).map((t) => t.name);
  const sections = other.length
    ? [...CATEGORIES, { title: 'Other', blurb: '', prompt: 'What can you do?', tools: other }]
    : CATEGORIES;

  return (
    <Page>
      <PageHeader
        title="What DeepBookie can do"
        subtitle={`${byName.size} tools the agent can call — tap any one to try it in chat; you sign every write yourself`}
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
                return <ToolRow key={name} name={name} desc={t.description} kind={t.kind} prompt={cat.prompt} />;
              })}
            </div>
          </section>
        ))}
      </div>
    </Page>
  );
}

function ToolRow({ name, desc, kind, prompt }: { name: string; desc: string; kind: 'read' | 'write'; prompt: string }) {
  return (
    <Link
      href={`/chat?q=${encodeURIComponent(prompt)}`}
      className="group block rounded-card border border-line bg-card p-3.5 transition hover:border-ink hover:shadow-[var(--shadow-raised)]"
    >
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
      <span className="mt-2 inline-block font-mono text-[10.5px] text-faint transition-colors group-hover:text-green">
        try in chat →
      </span>
    </Link>
  );
}
