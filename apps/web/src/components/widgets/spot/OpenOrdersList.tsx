'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CoinLogo } from '@/components/widgets/CoinLogo';
import { useTxAction } from '@/lib/hooks/useTxAction';
import { useBalanceManager } from '@/lib/hooks/useBalanceManager';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SUISCAN_TX } from '@/lib/constants';
import { formatUsd, shortenDigest } from '@/lib/format';
import type { SpotOpenOrder } from '@/lib/bff/spot-types';

const TH = 'text-[10px] font-semibold uppercase tracking-[0.1em] text-faint';
const PILL = 'rounded-card-in border border-[#E6C9BE] px-3 py-1 text-[11.5px] font-semibold text-clay';

/** SUI_DBUSDC -> SUI/DBUSDC; base coin drives the row logo. */
function parsePair(poolKey: string): { label: string; base: string } {
  const [base = poolKey, quote = ''] = poolKey.split('_');
  return { label: quote ? `${base}/${quote}` : base, base };
}

function fillPct(o: SpotOpenOrder): number {
  if (!o.quantity) return 0;
  return Math.max(0, Math.min(100, Math.round((o.filledQuantity / o.quantity) * 100)));
}

/** Spot maker orders — fill progress + per-row & bulk direct-sign cancels (mirrors PositionsTable). */
export function OpenOrdersList({ orders }: { orders: SpotOpenOrder[] }) {
  const account = useCurrentAccount();
  const bm = useBalanceManager(account?.address);
  const balanceManagerId = bm.data?.balanceManagerId ?? undefined;

  const cancelOne = useTxAction();
  const cancelAll = useTxAction();
  const [activeId, setActiveId] = useState<string | null>(null);

  if (!orders.length) {
    return (
      <Card className="flex h-[110px] flex-col items-center justify-center gap-2 text-center">
        <div className="h-[30px] w-[30px] rounded-card-in bg-[#F2EEE6]" />
        <div className="text-[13.5px] font-semibold text-ink">No open orders</div>
        <div className="text-[12px] text-muted">Place a limit order to make a market.</div>
      </Card>
    );
  }

  const poolKey = orders[0]!.poolKey; // non-empty: the empty case returned above
  const allBusy = cancelAll.status === 'signing';

  const runCancel = (orderId: string) => {
    setActiveId(orderId);
    void cancelOne.run('spot_cancel_order', { poolKey, orderId }, { balanceManagerId });
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-[#EDE9E0] bg-[#FAF8F3] px-4 py-2.5">
        <span className={TH}>{orders.length} open order{orders.length === 1 ? '' : 's'}</span>
        <button
          type="button"
          disabled={allBusy || !balanceManagerId}
          onClick={() => void cancelAll.run('spot_cancel_all_orders', { poolKey }, { balanceManagerId })}
          className={`${PILL} transition-colors hover:bg-[#FBF1EC] disabled:opacity-40`}
        >
          {allBusy ? 'Cancelling…' : 'Cancel all'}
        </button>
      </div>

      {cancelAll.status === 'done' && cancelAll.digest && (
        <a
          href={SUISCAN_TX(cancelAll.digest)}
          target="_blank"
          rel="noreferrer"
          className="block border-b border-[#F2EEE6] bg-[#F4F7F4] px-4 py-2 text-[11.5px] font-medium text-green hover:underline"
        >
          All orders cancelled · {shortenDigest(cancelAll.digest)} ↗
        </a>
      )}

      <div className="flex border-b border-[#F2EEE6] px-4 py-2.5">
        <span className={`${TH} flex-[1.6]`}>Order</span>
        <span className={`${TH} flex-1 text-right`}>Price</span>
        <span className={`${TH} flex-1 text-right`}>Size</span>
        <span className={`${TH} flex-[1.5] text-right`}>Filled</span>
        <span className="flex-[0.9]" />
      </div>

      {orders.map((o) => {
        const busy = cancelOne.status === 'signing' && activeId === o.orderId;
        const done = cancelOne.status === 'done' && activeId === o.orderId;
        return (
          <Row
            key={o.orderId}
            order={o}
            busy={busy}
            done={done}
            digest={done ? cancelOne.digest : null}
            canCancel={!!balanceManagerId && !busy && !allBusy}
            onCancel={() => runCancel(o.orderId)}
          />
        );
      })}
    </Card>
  );
}

function Row({
  order,
  busy,
  done,
  digest,
  canCancel,
  onCancel,
}: {
  order: SpotOpenOrder;
  busy: boolean;
  done: boolean;
  digest: string | null;
  canCancel: boolean;
  onCancel: () => void;
}) {
  const { label, base } = parsePair(order.poolKey);
  const pct = fillPct(order);
  const buy = order.isBid;

  return (
    <div className={`flex items-center border-b border-[#F2EEE6] px-4 py-3 last:border-b-0 ${busy ? 'opacity-60' : ''}`}>
      <div className="flex flex-[1.6] items-center gap-2">
        <CoinLogo asset={base} size={18} />
        <span className={`rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold ${buy ? 'border-green text-green' : 'border-clay text-clay'}`}>
          {buy ? 'BUY' : 'SELL'}
        </span>
        <span className="text-[12.5px] font-bold">{label}</span>
      </div>
      <span className="flex-1 text-right font-mono text-[13px] tabular-nums">{formatUsd(order.price, 4)}</span>
      <span className="flex-1 text-right font-mono text-[13px] tabular-nums">{formatUsd(order.quantity, 1)}</span>
      <div className="flex flex-[1.5] items-center justify-end gap-2">
        <div className="h-[5px] w-full max-w-[64px] overflow-hidden rounded-pill bg-[#EDE9E0]">
          <div className="h-full bg-green" style={{ width: `${pct}%` }} />
        </div>
        <span className={`font-mono text-[11px] tabular-nums ${pct > 0 ? 'text-[#7d7870]' : 'text-faint'}`}>
          {pct > 0 ? `${pct}%` : 'open'}
        </span>
      </div>
      <div className="flex flex-[0.9] items-center justify-end">
        {done && digest ? (
          <a
            href={SUISCAN_TX(digest)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10.5px] text-green hover:underline"
          >
            cancelled ↗
          </a>
        ) : busy ? (
          <span className="flex items-center gap-1.5">
            <span className="h-[13px] w-[13px] animate-spin rounded-full border-[1.5px] border-line border-t-clay" />
            <span className="font-mono text-[10.5px] text-muted">cancelling</span>
          </span>
        ) : (
          <button
            type="button"
            disabled={!canCancel}
            onClick={onCancel}
            className={`${PILL} transition-colors hover:bg-[#FBF1EC] disabled:opacity-40`}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
