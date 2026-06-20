'use client';

import { useState } from 'react';
import { useSpotWriteCard } from '@/components/widgets/spot/useSpotWriteCard';
import type { AddToolResult, OnSignOutcome, WriteToolPart } from '@/components/widgets/ReceiptController';
import { SignReceipt, type ReceiptLine } from '@/components/widgets/SignReceipt';
import { useSpotAccount, useSpotPoolParams } from '@/lib/hooks/useSpotRead';
import { SUISCAN_TX } from '@/lib/constants';
import { docNumberFor, formatAddress, formatUsd, num, poolLabel, str } from '@/lib/format';

const DEFAULT_POOL = 'SUI_DBUSDC';
const seed = (v: unknown) => (num(v) > 0 ? String(num(v)) : '');
/** Fee fields edit PERCENT; the agent proposes a FRACTION (0.0008 = 0.08%) — seed as percent so an
 *  un-edited proposal signs the agent's intended fee, not 1/100 of it (toFrac divides by 100 again). */
const seedPct = (v: unknown) => (num(v) > 0 ? String(num(v) * 100) : '');
/** Pool fees are stored as fractions (0.001 = 0.10%); the form edits PERCENT and signs the fraction. */
const pct = (frac: number) => `${(frac * 100).toFixed(2)}%`;
/** Percent input → on-chain fraction (0.08% → 0.0008). The proposal tool wants the fraction. */
const toFrac = (percentStr: string) => Number(percentStr) / 100;

type Mode = 'propose' | 'vote' | 'claim';
const DARK_BTN = 'w-full rounded-card-in bg-ink py-3 text-[13.5px] font-semibold text-paper transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

/** Pool governance: submit a fee proposal, vote with staked weight, or claim accrued rebates. */
export function GovernanceCard({
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
  const mode: Mode = w.toolName === 'spot_submit_proposal' ? 'propose' : w.toolName === 'spot_vote' ? 'vote' : 'claim';
  const poolKey = str(w.proposed.poolKey) || DEFAULT_POOL;
  const active = w.state === 'proposed';

  const params = useSpotPoolParams(active && mode === 'propose' ? poolKey : undefined);
  const account = useSpotAccount(active && mode !== 'propose' ? poolKey : undefined);

  const [taker, setTaker] = useState(() => seedPct(w.proposed.takerFee));
  const [maker, setMaker] = useState(() => seedPct(w.proposed.makerFee));
  const [stake, setStake] = useState(() => seed(w.proposed.stakeRequired));
  const [proposalId, setProposalId] = useState(() => str(w.proposed.proposalId));

  if (w.dismissed) return null;

  const docNumber = docNumberFor(part.toolCallId);
  const poolName = poolLabel(poolKey);

  if (w.state !== 'proposed') {
    return (
      <SignReceipt
        state={w.state}
        title={terminalTitle(mode, part)}
        lines={terminalLines(mode, poolName, part)}
        docNumber={docNumber}
        digest={w.digest}
        suiscanUrl={w.digest ? SUISCAN_TX(w.digest) : undefined}
        reason={w.reason}
        onRetry={onRetry}
        onDismiss={w.dismiss}
      />
    );
  }

  const cur = params.data;
  const rebates = account.data?.rebates ?? { base: 0, quote: 0, deep: 0 };
  const totalRebate = rebates.base + rebates.quote + rebates.deep;
  // Only "empty" on a SUCCESSFUL read — a failed read must not disable a legitimate claim.
  const emptyRebate = account.isSuccess && totalRebate <= 0;
  // Gate the retry affordance to a real transient (a no-BM user's 409 is handled by the no-BM note,
  // not an endless "couldn't reach your account" retry).
  const accountErr = mode !== 'propose' && account.isError && w.hasBalanceManager;

  return (
    <div className="w-full rounded-card border border-line bg-card p-4">
      <div className="mb-[14px] flex gap-[5px] rounded-[9px] bg-[#F6F4EF] p-[3px]">
        {(['propose', 'vote', 'claim'] as Mode[]).map((m) => (
          <div
            key={m}
            className={`flex-1 rounded-[7px] py-[7px] text-center text-xs ${mode === m ? 'bg-ink font-bold text-paper' : 'font-semibold text-[#7d7870]'}`}
          >
            {m === 'propose' ? 'Propose' : m === 'vote' ? 'Vote' : 'Claim'}
          </div>
        ))}
      </div>

      {mode === 'propose' && (
        <>
          <div className="mb-[14px] flex gap-[7px]">
            <RefStat label="Cur. taker" value={cur ? pct(cur.takerFee) : '—'} loading={params.isLoading} />
            <RefStat label="Cur. maker" value={cur ? pct(cur.makerFee) : '—'} loading={params.isLoading} />
            <RefStat label="Stake req" value={cur ? formatUsd(cur.stakeRequired, 0) : '—'} loading={params.isLoading} />
          </div>
          <div className="mb-2 flex gap-[9px]">
            <Field label="Taker fee" value={taker} onChange={setTaker} suffix="%" />
            <Field label="Maker fee" value={maker} onChange={setMaker} suffix="%" />
          </div>
          <div className="mb-[13px]">
            <Field label="Stake required · DEEP" value={stake} onChange={setStake} />
          </div>
          <button
            type="button"
            // Require BOTH fees — a blank field would otherwise sign a real on-chain 0% fee.
            disabled={!w.hasBalanceManager || !(Number(taker) > 0 && Number(maker) > 0)}
            onClick={() =>
              void w.sign(
                { poolKey, takerFee: toFrac(taker), makerFee: toFrac(maker), stakeRequired: Number(stake) },
                // Persist the EDITED values so the terminal receipt shows what was signed, not the proposal.
                { takerFee: toFrac(taker), makerFee: toFrac(maker), stakeRequired: Number(stake) },
              )
            }
            className={DARK_BTN}
          >
            Submit proposal
          </button>
        </>
      )}

      {mode === 'vote' && (
        <>
          <div className="mb-[11px]">
            <Field label="Proposal ID" value={proposalId} onChange={setProposalId} mono placeholder="0x…" />
          </div>
          <div className="mb-[13px] flex items-center justify-between rounded-[9px] border border-[#DCEAE2] bg-[#F4F7F4] px-3 py-[10px]">
            <span className="text-xs font-semibold text-green">Your vote weight</span>
            <span className="font-mono text-sm font-bold tabular-nums text-green">
              {account.isLoading || account.isError ? '—' : `${formatUsd(account.data?.stake.active ?? 0, 0)} DEEP`}
            </span>
          </div>
          <button
            type="button"
            disabled={!w.hasBalanceManager || proposalId.trim().length < 3}
            onClick={() => void w.sign({ poolKey, proposalId: proposalId.trim() }, { proposalId: proposalId.trim() })}
            className={DARK_BTN}
          >
            Cast vote
          </button>
          <div className="mt-[10px] text-[10.5px] leading-[1.4] text-faint">
            Your active stake is your voting power. Votes apply to the next epoch&apos;s fees.
          </div>
        </>
      )}

      {mode === 'claim' && (
        <>
          <div className="mb-2 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-faint">Accrued rebates</div>
          <div className={`mb-[13px] flex flex-col gap-px ${emptyRebate ? 'opacity-60' : ''}`}>
            <RebateRow sym={poolName.split('/')[0] || 'SUI'} tag="base" bg="#4DA2FF" glyph={(poolName.split('/')[0] || 'S').charAt(0)} value={rebates.base} loading={account.isLoading} empty={emptyRebate} />
            <RebateRow sym={poolName.split('/')[1] || 'DBUSDC'} tag="quote" bg="#1A1714" glyph="$" value={rebates.quote} loading={account.isLoading} empty={emptyRebate} />
            <RebateRow sym="DEEP" bg="#2C5E4A" glyph="◈" value={rebates.deep} loading={account.isLoading} empty={emptyRebate} last />
          </div>
          <button
            type="button"
            disabled={emptyRebate || accountErr || !w.hasBalanceManager || account.isLoading}
            onClick={() => void w.sign({ poolKey })}
            className="w-full rounded-card-in bg-green py-3 text-[13.5px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {accountErr ? 'Couldn’t load rebates' : emptyRebate ? 'Nothing to claim' : 'Claim rebates'}
          </button>
          {accountErr && (
            <button
              type="button"
              onClick={() => void account.refetch()}
              className="mt-2 w-full text-center text-[11px] font-semibold text-muted underline underline-offset-2"
            >
              Couldn’t reach your account — retry
            </button>
          )}
        </>
      )}

      {!w.hasBalanceManager && (
        <div className="mt-2 text-center text-[11px] text-faint">
          {w.bmError ? 'Couldn’t reach your account — retry in a moment.' : 'Create a DeepBook account first to use governance.'}
        </div>
      )}
      <button
        type="button"
        onClick={w.cancel}
        className="mt-2.5 w-full rounded-card-in border border-line-strong py-2 text-[12.5px] font-semibold text-[#7d7870] transition hover:bg-paper"
      >
        Cancel
      </button>
    </div>
  );
}

function RefStat({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="flex-1 rounded-card-in border border-[#EDE9E0] bg-[#FBFAF7] px-[9px] py-2">
      <div className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums">{loading ? '—' : value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
  mono,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex-1 rounded-card-in border border-line bg-[#FBFAF7] px-[11px] py-2">
      <div className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className="flex items-baseline">
        <input
          type={mono ? 'text' : 'number'}
          inputMode={mono ? 'text' : 'decimal'}
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? (suffix ? '0.00' : '0')}
          className={`w-full bg-transparent font-mono ${mono ? 'text-[16px]' : 'text-[15px]'} font-semibold tabular-nums text-ink outline-none placeholder:text-faint`}
        />
        {suffix && <span className="font-mono text-[13px] font-semibold text-muted">{suffix}</span>}
      </div>
    </div>
  );
}

function RebateRow({
  sym,
  tag,
  bg,
  glyph,
  value,
  loading,
  empty,
  last,
}: {
  sym: string;
  tag?: string;
  bg: string;
  glyph: string;
  value: number;
  loading?: boolean;
  empty?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center py-2 ${last ? '' : 'border-b border-[#F2EEE6]'}`}>
      <span className="flex size-[19px] items-center justify-center rounded-full text-[9px] font-bold text-paper" style={{ background: bg }}>
        {glyph}
      </span>
      <span className="ml-2 text-[12.5px] font-semibold text-ink">
        {sym}
        {tag && ` · ${tag}`}
      </span>
      <span className={`ml-auto font-mono text-[13px] font-semibold tabular-nums ${empty ? 'text-[#a8a298]' : 'text-green'}`}>
        {loading ? '—' : formatUsd(value)}
      </span>
    </div>
  );
}

function terminalTitle(mode: Mode, part: WriteToolPart): string {
  const i = { ...(part.input ?? {}), ...(part.output ?? {}) }; // output (edited, signed) wins over input (proposal)
  if (mode === 'propose') return `Propose fees ${(num(i.takerFee) * 100).toFixed(2)}% / ${(num(i.makerFee) * 100).toFixed(2)}%`;
  if (mode === 'vote') return 'Vote on proposal';
  return 'Claim rebates';
}

function terminalLines(mode: Mode, poolLabel: string, part: WriteToolPart): ReceiptLine[] {
  const i = { ...(part.input ?? {}), ...(part.output ?? {}) }; // output (edited, signed) wins over input (proposal)
  if (mode === 'propose') {
    return [
      { label: 'Pool', value: poolLabel },
      { label: 'Stake required', value: `${formatUsd(num(i.stakeRequired), 0)} DEEP`, strong: true },
    ];
  }
  if (mode === 'vote') {
    return [
      { label: 'Pool', value: poolLabel },
      { label: 'Proposal', value: formatAddress(str(i.proposalId)) || '—', strong: true },
    ];
  }
  return [{ label: 'Pool', value: poolLabel, strong: true, accent: true }];
}
