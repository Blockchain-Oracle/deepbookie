'use client';

import { useState } from 'react';
import { useSpotWriteCard } from '@/components/widgets/spot/useSpotWriteCard';
import type { AddToolResult, OnSignOutcome, WriteToolPart } from '@/components/widgets/ReceiptController';
import { SignReceipt, type ReceiptLine } from '@/components/widgets/SignReceipt';
import { useSpotAccount, useSpotBalance } from '@/lib/hooks/useSpotRead';
import { SUISCAN_TX } from '@/lib/constants';
import { docNumberFor, formatUsd, num, poolLabel } from '@/lib/format';

const DEFAULT_POOL = 'SUI_DBUSDC';
const deep = (n: number) => formatUsd(n, 0);

/** Stake / unstake DEEP for fee discounts + governance weight. Requires a BalanceManager. */
export function StakeCard({
  part,
  addToolResult,
  onOutcome,
  onRetry,
}: {
  part: WriteToolPart;
  addToolResult: AddToolResult;
  onOutcome?: OnSignOutcome;
  onRetry: () => void;
}) {
  const w = useSpotWriteCard(part, addToolResult, onOutcome);
  const isUnstake = w.toolName === 'spot_unstake';
  const poolKey = (typeof w.proposed.poolKey === 'string' && w.proposed.poolKey) || DEFAULT_POOL;

  const account = useSpotAccount(w.state === 'proposed' ? poolKey : undefined);
  const deepBal = useSpotBalance(w.state === 'proposed' && !isUnstake ? 'DEEP' : undefined);
  const active = account.data?.stake.active ?? 0;
  const inactive = account.data?.stake.inactive ?? 0;
  const wallet = deepBal.data?.balance ?? 0;

  const [amount, setAmount] = useState<string>(() => {
    const seed = num(w.proposed.amount);
    return seed > 0 ? String(seed) : '';
  });
  // Snapshot the EDITED amount at sign time; we also persist it to the tool output (below), so the
  // receipt — and a History replay after remount — shows what was signed, not the agent's proposal
  // or an ephemeral 0 (the account/balance reads are disabled in terminal states).
  const [signedAmt, setSignedAmt] = useState(0);

  if (w.dismissed) return null;

  const title = isUnstake ? 'Unstake DEEP' : 'Stake DEEP';
  const docNumber = docNumberFor(part.toolCallId);

  // Terminal states render the receipt; line copy matches the design (Pool + Amount). The signed
  // figure lives in the durable output (persisted at sign time) so it survives remount + replay.
  if (w.state !== 'proposed') {
    const amt = num(part.output?.amount) || signedAmt;
    const lines: ReceiptLine[] = [
      { label: 'Pool', value: poolLabel(poolKey) },
      { label: isUnstake ? 'Amount returned' : 'Amount', value: `${deep(amt)} DEEP`, strong: true, accent: !isUnstake },
    ];
    return (
      <SignReceipt
        state={w.state}
        title={isUnstake ? `Unstake ${deep(amt)} DEEP` : `Stake ${deep(amt)} DEEP`}
        lines={lines}
        docNumber={docNumber}
        digest={w.digest}
        suiscanUrl={w.digest ? SUISCAN_TX(w.digest) : undefined}
        reason={w.reason}
        onRetry={onRetry}
        onDismiss={w.dismiss}
      />
    );
  }

  // No BalanceManager → staking lives in the spot account. Resolve the tool call via Dismiss (so the
  // assistant turn never wedges) and, on a resolver failure, offer Retry instead of implying "create".
  if (!w.hasBalanceManager && !w.bmLoading) {
    return (
      <div className="flex w-full flex-col justify-center gap-[11px] rounded-card border border-line bg-card p-5">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">{title}</div>
        {w.bmError ? (
          <>
            <div className="text-[16px] font-bold leading-[1.3] tracking-[-0.02em] text-ink">Couldn’t reach your account</div>
            <div className="text-[12px] leading-[1.45] text-muted">
              A network hiccup checking your balance manager — retry in a moment; don’t create a new one.
            </div>
          </>
        ) : (
          <>
            <div className="text-[16px] font-bold leading-[1.3] tracking-[-0.02em] text-ink">
              A balance manager
              <br />
              is required to stake
            </div>
            <div className="text-[12px] leading-[1.45] text-muted">
              Staking lives in your spot account — open one (the spot account card), then stake DEEP from it.
            </div>
          </>
        )}
        <div className="mt-0.5 flex gap-2.5">
          {w.bmError && (
            <button
              type="button"
              onClick={w.bmRefetch}
              className="flex-1 rounded-[9px] border border-line-strong py-3 text-[13px] font-semibold text-ink transition hover:bg-paper"
            >
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={w.cancel}
            className="flex-1 rounded-[9px] border border-line-strong py-3 text-[13px] font-semibold text-[#7d7870] transition hover:bg-paper"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const amt = Number(amount);
  // While the DEEP balance is loading or errored, don't cap (avoid a false "too much"); once the
  // balance is known, enforce amt <= wallet so the user can't try to stake more than they hold.
  const deepKnown = !deepBal.isLoading && !deepBal.isError;
  const stakeValid = amt > 0 && (!deepKnown || amt <= wallet) && w.hasBalanceManager;
  // On-chain `unstake` withdraws ALL stake (active + inactive) — fresh same-epoch stake sits in
  // `inactive` until the next epoch, so gating on `active` alone would block a legitimate unstake.
  const totalStake = active + inactive;
  const canUnstake = totalStake > 0 && w.hasBalanceManager;

  const onSubmit = () => {
    if (isUnstake) {
      if (canUnstake) {
        setSignedAmt(totalStake);
        void w.sign({ poolKey }, { amount: totalStake });
      }
    } else if (stakeValid) {
      setSignedAmt(amt);
      void w.sign({ poolKey, amount: amt }, { amount: amt });
    }
  };

  return (
    <div className="w-full rounded-card border border-line bg-card p-4">
      <div className="mb-[13px] flex items-center gap-2">
        <span className="text-sm font-bold text-ink">{title}</span>
        <span className="rounded-pill border border-line bg-[#F6F4EF] px-[9px] py-[3px] font-mono text-[9.5px] text-muted">
          {poolLabel(poolKey)} pool
        </span>
      </div>

      <div className="mb-[14px] flex gap-[9px]">
        <Stat label="Active stake" value={deep(active)} loading={account.isLoading} />
        <Stat label="Inactive" value={deep(inactive)} muted loading={account.isLoading} />
      </div>

      {isUnstake ? (
        account.isError ? (
          <button
            type="button"
            onClick={() => void account.refetch()}
            className="w-full rounded-[9px] border border-line-strong py-3 text-[13px] font-semibold text-ink transition hover:bg-paper"
          >
            Couldn’t load your stake — retry
          </button>
        ) : (
          <>
            <div className="mb-[13px] flex items-center justify-between rounded-[9px] border border-[#DCEAE2] bg-[#F4F7F4] px-3 py-[11px]">
              <span className="text-[12px] font-semibold text-green">Unstake all (active + inactive)</span>
              <span className="font-mono text-[15px] font-bold tabular-nums text-green">{deep(totalStake)} DEEP</span>
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canUnstake}
              className="w-full rounded-[9px] bg-green py-3 text-[13.5px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {account.isLoading ? 'Loading…' : canUnstake ? `Unstake all · ${deep(totalStake)}` : 'Nothing staked'}
            </button>
          </>
        )
      ) : (
        <>
          <div className="mb-[13px] rounded-[9px] border border-line bg-[#FBFAF7] px-[13px] py-[11px]">
            <div className="mb-1.5 flex justify-between">
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">Amount to stake</span>
              <span className="font-mono text-[10.5px] text-muted">
                bal {deep(wallet)} ·{' '}
                <button type="button" onClick={() => setAmount(String(wallet))} className="font-bold text-green">
                  Max
                </button>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                className="w-full bg-transparent font-mono text-[20px] font-semibold tabular-nums text-ink outline-none placeholder:text-faint"
              />
              <div className="flex flex-none items-center gap-1.5 rounded-pill border border-line bg-card py-1 pl-[5px] pr-[9px]">
                <span className="flex size-[18px] items-center justify-center rounded-full bg-green text-[9px] font-bold text-paper">◈</span>
                <span className="text-[12.5px] font-bold text-ink">DEEP</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!stakeValid}
            className="w-full rounded-[9px] bg-green py-3 text-[13.5px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {amt > 0 ? `Stake ${deep(amt)}` : 'Stake DEEP'}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={w.cancel}
        className="mt-2.5 w-full rounded-card-in border border-line-strong py-2 text-[12.5px] font-semibold text-[#7d7870] transition hover:bg-paper"
      >
        Cancel
      </button>

      <div className="mt-[11px] text-[10.5px] leading-[1.4] text-faint">
        Staked DEEP lowers your trading fees and lets you vote on pool governance.
      </div>
    </div>
  );
}

function Stat({ label, value, muted, loading }: { label: string; value: string; muted?: boolean; loading?: boolean }) {
  return (
    <div className="flex-1 rounded-[9px] border border-line bg-[#FBFAF7] px-3 py-[10px]">
      <div className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">{label}</div>
      <div className={`mt-[3px] font-mono text-[17px] font-semibold tabular-nums ${muted ? 'text-faint' : 'text-ink'}`}>
        {loading ? '—' : value}
      </div>
    </div>
  );
}
