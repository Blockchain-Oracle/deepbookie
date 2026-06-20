'use client';

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
import { ReceiptController, type AddToolResult, type WriteToolPart } from '@/components/widgets/ReceiptController';
import type { Market, MarketState, Odds, Portfolio, Position, Positions, Quote, RangeQuote, Vault } from '@/lib/bff/types';

type Part = UIMessage['parts'][number];
const WRITE = new Set(['create_manager', 'mint', 'redeem', 'mint_range', 'redeem_range', 'supply', 'withdraw']);

interface ToolView {
  type: string;
  state?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  toolCallId: string;
  errorText?: string;
}

function PositionList({ positions }: { positions: Positions }) {
  if (!positions.minted.length && !positions.redeemed.length) {
    return <Card className="p-4 text-center text-sm text-muted">No positions yet.</Card>;
  }
  return (
    <div className="flex flex-col gap-2">
      {positions.minted.map((p, i) => (
        <PositionCard key={`m${i}`} position={p} />
      ))}
      {positions.redeemed.map((p, i) => (
        <PositionCard key={`r${i}`} position={p} settled />
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
}: {
  role: string;
  part: Part;
  addToolResult: AddToolResult;
  onAction: (text: string) => void;
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

  if (WRITE.has(name)) {
    return (
      <ReceiptController
        part={tp as WriteToolPart}
        addToolResult={addToolResult}
        onRetry={() => onAction('Let’s try that again.')}
      />
    );
  }

  if (tp.state === 'output-error') {
    return <Card className="border-[#E6C9BE] p-3 text-xs text-clay">Couldn’t load {name.replace(/_/g, ' ')}.</Card>;
  }
  const ready = tp.state === 'output-available';
  const out = tp.output;

  switch (name) {
    case 'get_odds':
      return (
        <OddsCurveCard
          status={ready ? 'live' : 'loading'}
          odds={ready ? (out as Odds) : undefined}
          onBet={(d, s) => onAction(`Buy ${d} at $${Math.round(s)}.`)}
        />
      );
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
        <MarketTable markets={out as Market[]} onPick={(m) => onAction(`Show the odds for the ${m.asset} market ${m.oracleId}.`)} />
      ) : (
        skeleton('h-24')
      );
    default:
      return ready ? null : skeleton('h-12');
  }
}
