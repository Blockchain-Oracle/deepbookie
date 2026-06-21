'use client';

import { Card } from '@/components/ui/Card';
import { CoinLogo } from '@/components/widgets/CoinLogo';
import { useTxAction } from '@/lib/hooks/useTxAction';
import { useBalanceManager } from '@/lib/hooks/useBalanceManager';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SUISCAN_TX } from '@/lib/constants';
import { formatUsd, shortenDigest, splitPool } from '@/lib/format';
import type { SpotOpenOrder } from '@/lib/bff/spot-types';

const TH = 'text-[10px] font-semibold uppercase tracking-[0.1em] text-faint';
const PILL = 'rounded-card-in border border-[#E6C9BE] px-3 py-1 text-[11.5px] font-semibold text-clay';

function fillPct(o: SpotOpenOrder): number {
  if (!o.quantity) return 0;
  return Math.max(0, Math.min(100, Math.round((o.filledQuantity / o.quantity) * 100)));
}

/**
 * Spot maker orders — fill progress + per-row & bulk direct-sign cancels (mirrors PositionsTable).
 * NOTE: these cancels are user-initiated convenience actions on a READ widget, not AI tool calls, so
 * they have no toolCallId and are deliberately NOT written to the durable tx-outcome ledger (which is
 * keyed by toolCallId for replayable chat writes). Failures ARE surfaced inline (per-row ✗ Retry +
 * banner). An agent-PROPOSED cancel routes through ReceiptController instead and IS ledgered.
 */
export function OpenOrdersList({ orders }: { orders: SpotOpenOrder[] }) {
  const account = useCurrentAccount();
  const bm = useBalanceManager(account?.address);
  const balanceManagerId = bm.data?.balanceManagerId ?? undefined;
  // A resolver FAILURE (transient) leaves balanceManagerId undefined → cancels disable. Distinguish it
  // from a genuine "no account" so we show a Retry banner, not silently-dead buttons (mirrors the write
  // cards' NoBalanceManagerNotice). The order LIST renders independently of the BM resolver.
  const bmError = (bm.data?.error ?? false) || bm.isError;

  const cancelAll = useTxAction();

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

      {bmError && !balanceManagerId && (
        <div className="flex items-center justify-between gap-2.5 border-b border-[#F2EEE6] bg-[#FBF1EC] px-4 py-2">
          <span className="text-[11.5px] font-medium text-clay">Couldn’t reach your account — cancels are paused.</span>
          <button
            type="button"
            onClick={() => void bm.refetch()}
            className="flex-none text-[11.5px] font-semibold text-ink underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

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

      {cancelAll.status === 'error' && cancelAll.reason && (
        <div className="border-b border-[#F2EEE6] bg-[#FBF1EC] px-4 py-2 text-[11.5px] font-medium text-clay">
          {cancelAll.reason}
        </div>
      )}

      <div className="flex border-b border-[#F2EEE6] px-4 py-2.5">
        <span className={`${TH} flex-[1.6]`}>Order</span>
        <span className={`${TH} flex-1 text-right`}>Price</span>
        <span className={`${TH} flex-1 text-right`}>Size</span>
        <span className={`${TH} flex-[1.5] text-right`}>Filled</span>
        <span className="flex-[0.9]" />
      </div>

      {orders.map((o) => (
        <Row
          key={o.orderId}
          order={o}
          poolKey={poolKey}
          balanceManagerId={balanceManagerId}
          allBusy={allBusy}
          allDone={cancelAll.status === 'done'}
        />
      ))}
    </Card>
  );
}

/** Each row owns its own cancel action so one row's receipt never clobbers another's. */
function Row({
  order,
  poolKey,
  balanceManagerId,
  allBusy,
  allDone,
}: {
  order: SpotOpenOrder;
  poolKey: string;
  balanceManagerId?: string;
  allBusy: boolean;
  allDone: boolean;
}) {
  const cancel = useTxAction();
  const busy = cancel.status === 'signing';
  const done = cancel.status === 'done' && !!cancel.digest;
  // After a successful "Cancel all", these rows are stale until refetch — don't offer a per-row cancel
  // that would abort on an already-cancelled order.
  const canCancel = !!balanceManagerId && !busy && !allBusy && !allDone;

  const { base, pair: label } = splitPool(order.poolKey);
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
        {done && cancel.digest ? (
          <a
            href={SUISCAN_TX(cancel.digest)}
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
        ) : cancel.status === 'error' ? (
          // Surface the failure (don't silently revert to "Cancel") — reason on hover, click to retry.
          <button
            type="button"
            title={cancel.reason ?? undefined}
            disabled={!canCancel}
            onClick={() => void cancel.run('spot_cancel_order', { poolKey, orderId: order.orderId }, { balanceManagerId })}
            className={`${PILL} transition-colors hover:bg-[#FBF1EC] disabled:opacity-40`}
          >
            ✗ Retry
          </button>
        ) : allDone ? (
          <span className="font-mono text-[10.5px] text-faint">cancelled</span>
        ) : (
          <button
            type="button"
            disabled={!canCancel}
            onClick={() => void cancel.run('spot_cancel_order', { poolKey, orderId: order.orderId }, { balanceManagerId })}
            className={`${PILL} transition-colors hover:bg-[#FBF1EC] disabled:opacity-40`}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
