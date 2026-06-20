import { Card } from '@/components/ui/Card';
import { KV, Label } from './kit';
import { formatPct, formatUsd } from '@/lib/format';
import type { Quote } from '@/lib/bff/types';

export function QuotePreview({ quote }: { quote: Quote }) {
  return (
    <Card className="p-4">
      <Label>Preview · dry run</Label>
      <div className="mt-1.5">
        <KV label="Implied probability" value={formatPct(quote.askProbability)} />
        <KV label="Strike" value={`$${formatUsd(quote.strikeUsd, 0)}`} />
        <KV label="Cost" value={`${formatUsd(quote.mintCostUsd)} dUSDC`} />
        <div className="mt-1 border-t border-line">
          <KV label="Max payout" value={`${formatUsd(quote.quantityUsd)} dUSDC`} strong accent />
        </div>
      </div>
    </Card>
  );
}
