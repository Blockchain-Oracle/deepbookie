import { allTools } from '@deepbookie/core';
import { Page, PageHeader } from '@/components/shell/Page';
import { ToolRow } from './ToolRow';

// Keeper tool — not user-facing, hidden from the catalog (matches the agent's excluded set).
const HIDDEN = new Set(['redeem_permissionless']);

const CATEGORIES: { title: string; blurb: string; tools: string[] }[] = [
  {
    title: 'Markets & odds',
    blurb: 'Live markets, the probability curve, and exact quotes.',
    tools: ['list_markets', 'get_market', 'get_odds', 'get_quote', 'get_range_quote', 'get_recent_bets'],
  },
  {
    title: 'Place a bet',
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
  {
    title: 'Swap',
    blurb: 'Swap tokens on the DeepBook V3 order book.',
    tools: ['spot_list_pools', 'spot_mid_price', 'spot_swap_quote', 'spot_swap_base_for_quote', 'spot_swap_quote_for_base'],
  },
  {
    title: 'Orders & liquidity',
    blurb: 'Place, modify and cancel limit/market orders (a maker order is liquidity).',
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
    tools: ['spot_create_balance_manager', 'spot_deposit', 'spot_withdraw', 'spot_balance', 'spot_account', 'spot_withdraw_settled_amounts'],
  },
  {
    title: 'Stake DEEP',
    blurb: 'Stake DEEP for fee discounts and governance voting power.',
    tools: ['spot_stake', 'spot_unstake'],
  },
  {
    title: 'Governance',
    blurb: 'Propose fee changes, vote your stake, claim rebates.',
    tools: ['spot_submit_proposal', 'spot_vote', 'spot_claim_rebates'],
  },
];

/** Tool catalog — generated from the live core registry so it can never drift from what ships.
 *  Click any tool to copy its name to the clipboard. */
export default function ToolsPage() {
  const byName = new Map(allTools.filter((t) => !HIDDEN.has(t.name)).map((t) => [t.name, t]));
  const categorized = new Set(CATEGORIES.flatMap((c) => c.tools));
  const other = [...byName.values()].filter((t) => !categorized.has(t.name)).map((t) => t.name);
  const sections = other.length ? [...CATEGORIES, { title: 'Other', blurb: '', tools: other }] : CATEGORIES;

  return (
    <Page>
      <PageHeader
        title="What DeepBookie can do"
        subtitle={`${byName.size} tools the agent can call — click any one to copy its name; you sign every write yourself`}
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
