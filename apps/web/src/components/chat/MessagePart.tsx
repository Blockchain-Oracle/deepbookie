'use client';

import type { ReactNode } from 'react';
import type { UIMessage } from 'ai';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Markdown } from '@/components/chat/Markdown';
import { OddsCurveCard } from '@/components/widgets/OddsCurveCard';
import { MarketHeader } from '@/components/widgets/MarketHeader';
import { MarketTable } from '@/components/widgets/MarketTable';
import { QuotePreview } from '@/components/widgets/QuotePreview';
import { RangePayoff } from '@/components/widgets/RangePayoff';
import { VaultCard } from '@/components/widgets/VaultCard';
import { PortfolioRollup } from '@/components/widgets/PortfolioRollup';
import { PositionCard } from '@/components/widgets/PositionCard';
import { ActivityTape } from '@/components/widgets/ActivityTape';
import {
  ReceiptController,
  type AddToolResult,
  type OnSignOutcome,
  type WriteToolPart,
} from '@/components/widgets/ReceiptController';
import { SpotPoolTable } from '@/components/widgets/spot/SpotPoolTable';
import { OrderbookDepth } from '@/components/widgets/spot/OrderbookDepth';
import { OpenOrdersList } from '@/components/widgets/spot/OpenOrdersList';
import { BalanceManagerPanel } from '@/components/widgets/spot/BalanceManagerPanel';
import { OrderValidityHint } from '@/components/widgets/spot/OrderValidityHint';
import { SpotFacts } from '@/components/widgets/spot/SpotFacts';
import { SwapCard } from '@/components/widgets/spot/SwapCard';
import { LimitOrderTicket } from '@/components/widgets/spot/LimitOrderTicket';
import { ModifyOrderCard } from '@/components/widgets/spot/ModifyOrderCard';
import { StakeCard } from '@/components/widgets/spot/StakeCard';
import { GovernanceCard } from '@/components/widgets/spot/GovernanceCard';
import { SettledSweepCard } from '@/components/widgets/spot/SettledSweepCard';
import { StaticToolReceipt, StaticReadStub, HOOK_FIRING_READS } from '@/components/chat/StaticToolReceipt';
import { poolLabel } from '@/lib/format';
import type { Market, MarketState, Odds, Portfolio, Position, Positions, Quote, RangeQuote, Vault } from '@/lib/bff/types';
import type { SpotCanPlace, SpotOpenOrder, SpotOrderbook, SpotPool } from '@/lib/bff/spot-types';

type Part = UIMessage['parts'][number];

/** Predict writes + spot zero/fixed-input writes → the fixed ReceiptController (sign as proposed). */
const WRITE = new Set([
  'create_manager',
  'mint',
  'redeem',
  'mint_range',
  'redeem_range',
  'supply',
  'withdraw',
  'spot_create_balance_manager',
  'spot_deposit',
  'spot_withdraw',
  'spot_cancel_order',
  'spot_cancel_all_orders',
]);

/** Spot generative-input writes → bespoke cards (user edits the values, then signs). All share the
 *  same write-part props ({ part, addToolResult, onOutcome, onRetry }). */
const SPOT_INPUT: Record<
  string,
  (p: { part: WriteToolPart; addToolResult: AddToolResult; onOutcome?: OnSignOutcome; onRetry: () => void }) => ReactNode
> = {
  spot_swap_base_for_quote: SwapCard,
  spot_swap_quote_for_base: SwapCard,
  spot_place_limit_order: LimitOrderTicket,
  spot_modify_order: ModifyOrderCard,
  spot_stake: StakeCard,
  spot_unstake: StakeCard,
  spot_submit_proposal: GovernanceCard,
  spot_vote: GovernanceCard,
  spot_claim_rebates: GovernanceCard,
  spot_withdraw_settled_amounts: SettledSweepCard,
};

interface ToolView {
  type: string;
  state?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  toolCallId: string;
  errorText?: string;
}

function PositionList({ positions }: { positions: Positions }) {
  if (!positions.open.length && !positions.redeemed.length) {
    return <Card className="p-4 text-center text-sm text-muted">No positions yet.</Card>;
  }
  return (
    <div className="flex flex-col gap-2">
      {positions.open.map((p) => (
        <PositionCard
          key={`m-${p.oracleId}-${p.strikeUsd}-${p.direction}-${p.expiry}`}
          position={p}
          managerId={positions.managerId}
        />
      ))}
      {positions.redeemed.map((p) => (
        <PositionCard key={`r-${p.oracleId}-${p.strikeUsd}-${p.direction}-${p.expiry}`} position={p} settled />
      ))}
    </div>
  );
}

const skeleton = (h: string) => <Skeleton className={`${h} w-full rounded-card`} />;

export function MessagePart({
  role,
  part,
  addToolResult,
  onAction,
  onOutcome,
  readOnly,
}: {
  role: string;
  part: Part;
  addToolResult: AddToolResult;
  onAction: (text: string) => void;
  onOutcome?: OnSignOutcome;
  /** Archived/replay view: render every tool part STATICALLY — no interactive cards, no live hooks
   *  (which would freeze the page), no re-prompt/re-sign on a finished conversation. */
  readOnly?: boolean;
}) {
  if (part.type === 'text') {
    if (role === 'user') {
      return (
        <div className="ml-auto w-fit max-w-[82%] whitespace-pre-wrap rounded-[16px_16px_5px_16px] bg-ink px-4 py-2.5 text-sm leading-snug text-paper [overflow-wrap:anywhere]">
          {part.text}
        </div>
      );
    }
    return (
      <div className="max-w-[92%]">
        <Markdown>{part.text}</Markdown>
      </div>
    );
  }

  if (!part.type.startsWith('tool-')) return null;
  const tp = part as ToolView;
  const name = tp.type.slice('tool-'.length);

  // Archived/replay view: render static records only — never the interactive cards (they show
  // Sign/Deposit buttons on a finished chat) and never the hook-firing read widgets (they'd fire live
  // network polls and freeze the page). Pure-data read cards fall through but with their click/prompt
  // callbacks gated off (below), so the user can SEE the odds/markets but can't re-prompt.
  if (readOnly) {
    if (WRITE.has(name) || SPOT_INPUT[name]) return <StaticToolReceipt part={tp} />;
    if (HOOK_FIRING_READS.has(name)) return <StaticReadStub name={name} />;
  }

  // Spot generative-input writes → their bespoke card (handles its own states + sign). These cards
  // seed editable fields from part.input via one-shot useState initializers, so we must wait until the
  // tool input has finished streaming — mounting mid-stream would capture empty input and drop the
  // agent's proposed values (the React key is stable, so there's no remount to re-seed).
  const SpotInputCard = SPOT_INPUT[name];
  if (SpotInputCard) {
    // Wait for the FINAL streamed input: both the streaming state AND a present `input` object — a
    // one-shot lazy seed captured against undefined input would silently drop the agent's proposal.
    if (tp.state === 'input-streaming' || !tp.input) return skeleton('h-40');
    return (
      <SpotInputCard
        part={tp as WriteToolPart}
        addToolResult={addToolResult}
        onOutcome={onOutcome}
        onRetry={() => onAction('Let’s try that again.')}
      />
    );
  }

  if (WRITE.has(name)) {
    return (
      <ReceiptController
        part={tp as WriteToolPart}
        addToolResult={addToolResult}
        onRetry={() => onAction('Let’s try that again.')}
        onOutcome={onOutcome}
      />
    );
  }

  if (tp.state === 'output-error') {
    // No PredictManager yet → a friendly "open your account" card, not a raw error.
    const noManager =
      (name === 'get_portfolio' || name === 'get_positions') &&
      (tp.errorText ?? '').toLowerCase().includes('manager');
    // No DeepBook BalanceManager yet → offer to open the spot account.
    const noSpotAccount = name.startsWith('spot_') && (tp.errorText ?? '').toLowerCase().includes('balance manager');
    if (noSpotAccount) {
      return (
        <Card className="p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">DeepBook spot</div>
          <div className="mt-1 text-[15px] font-semibold">No spot account yet</div>
          <p className="mt-1 text-[13px] leading-snug text-muted">
            Open a DeepBook BalanceManager — you sign it in your wallet — to deposit, swap, and trade.
          </p>
          <button
            type="button"
            onClick={() => onAction('Open my DeepBook spot account.')}
            className="mt-3 inline-flex rounded-card-in bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition hover:opacity-90"
          >
            Open spot account →
          </button>
        </Card>
      );
    }
    if (noManager) {
      return (
        <Card className="p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Your account</div>
          <div className="mt-1 text-[15px] font-semibold">No trading account yet</div>
          <p className="mt-1 text-[13px] leading-snug text-muted">
            Open a PredictManager — you sign it in your wallet — to place bets and see your balance.
          </p>
          <button
            type="button"
            onClick={() => onAction('Open my trading account.')}
            className="mt-3 inline-flex rounded-card-in bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition hover:opacity-90"
          >
            Open account →
          </button>
        </Card>
      );
    }
    return <Card className="border-[#E6C9BE] p-3 text-xs text-clay">Couldn’t load {name.replace(/_/g, ' ')}.</Card>;
  }
  const ready = tp.state === 'output-available';
  const out = tp.output;

  switch (name) {
    case 'get_odds': {
      // Carry the FULL context the user picked on the card (market + strike + direction + amount) so the
      // agent quotes + proposes the exact bet — no re-picking a market/strike, no lost context.
      // `tp.input` is undefined while the call is still streaming (input-streaming) or on a restored
      // part with no saved input — optional-chain it so this read can never crash the whole chat.
      const oracleId = (tp.input as { oracleId?: string } | undefined)?.oracleId ?? '';
      return (
        <OddsCurveCard
          status={ready ? 'live' : 'loading'}
          odds={ready ? (out as Odds) : undefined}
          onBet={
            readOnly
              ? undefined
              : (d, s, amt) => onAction(`Place a $${amt} ${d} bet at strike $${Math.round(s)} on market ${oracleId}.`)
          }
        />
      );
    }
    case 'get_market':
      return ready ? <MarketHeader market={out as MarketState} /> : skeleton('h-16');
    case 'get_quote':
      return ready ? <QuotePreview quote={out as Quote} /> : skeleton('h-28');
    case 'get_range_quote':
      return ready ? <RangePayoff quote={out as RangeQuote} /> : skeleton('h-32');
    case 'get_vault':
      return ready ? <VaultCard vault={out as Vault} /> : skeleton('h-32');
    case 'get_portfolio':
      return ready ? <PortfolioRollup portfolio={out as Portfolio} /> : skeleton('h-24');
    case 'get_positions':
      return ready ? <PositionList positions={out as Positions} /> : skeleton('h-20');
    case 'get_recent_bets':
      return ready ? <ActivityTape bets={out as Position[]} /> : skeleton('h-24');
    case 'list_markets':
      return ready ? (
        <MarketTable
          markets={out as Market[]}
          onPick={readOnly ? undefined : (m) => onAction(`Show the odds for the ${m.asset} market ${m.oracleId}.`)}
        />
      ) : (
        skeleton('h-24')
      );
    // ── Spot (DeepBook V3) reads ──
    case 'spot_list_pools':
      return ready ? (
        <SpotPoolTable pools={out as SpotPool[]} onTrade={(pk) => onAction(`I want to swap on the ${poolLabel(pk)} pool.`)} />
      ) : (
        skeleton('h-40')
      );
    case 'spot_orderbook':
      return ready ? <OrderbookDepth data={out as SpotOrderbook} /> : skeleton('h-40');
    case 'spot_open_orders':
      return ready ? <OpenOrdersList orders={out as SpotOpenOrder[]} /> : skeleton('h-24');
    case 'spot_account':
      return ready ? <BalanceManagerPanel onAction={onAction} /> : skeleton('h-40');
    case 'spot_can_place_limit_order':
      return ready ? <OrderValidityHint valid={(out as SpotCanPlace).canPlace} /> : skeleton('h-10');
    case 'spot_mid_price':
    case 'spot_pool_params':
    case 'spot_swap_quote':
    case 'spot_balance':
      return ready ? <SpotFacts name={name} data={out} /> : skeleton('h-16');
    default:
      return ready ? null : skeleton('h-12');
  }
}
