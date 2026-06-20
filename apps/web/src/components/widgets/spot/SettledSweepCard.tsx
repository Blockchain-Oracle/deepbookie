'use client';

import { useSpotWriteCard } from '@/components/widgets/spot/useSpotWriteCard';
import type { AddToolResult, OnSignOutcome, WriteToolPart } from '@/components/widgets/ReceiptController';
import { SignReceipt, type ReceiptLine } from '@/components/widgets/SignReceipt';
import { useSpotAccount } from '@/lib/hooks/useSpotRead';
import type { SpotBalances } from '@/lib/bff/spot-types';
import { SUISCAN_TX } from '@/lib/constants';
import { formatUsd, splitPool } from '@/lib/format';

const DEFAULT_POOL = 'SUI_DBUSDC';
const ZERO: SpotBalances = { base: 0, quote: 0, deep: 0 };

/** A coin amount worth showing — drops dust below half a display unit. */
const sig = (n: number) => Math.abs(n) >= 0.005;

/** Settled-proceeds line ("12.40 DBUSDC · 3.20 SUI · 8.05 DEEP"), in pool order. */
function proceedsParts(b: SpotBalances, base: string, quote: string): { label: string; value: number }[] {
  return [
    { label: base, value: b.base },
    { label: quote, value: b.quote },
    { label: 'DEEP', value: b.deep },
  ].filter((p) => sig(p.value));
}

const fmtProceeds = (parts: { label: string; value: number }[]) =>
  parts.map((p) => `${formatUsd(p.value, 2)} ${p.label}`).join(' · ');

/**
 * Sweep filled-order proceeds out of the BalanceManager (`spot_withdraw_settled_amounts`).
 * Reads the account's settled balances (rebates, then locked as a fallback proxy) and, when
 * there's something to claim, renders an actionable banner. Nothing to sweep → a quiet note.
 * No numeric input: the only choice is to authorize. Requires a BalanceManager.
 */
export function SettledSweepCard({
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
  const poolKey = (typeof w.proposed.poolKey === 'string' && w.proposed.poolKey) || DEFAULT_POOL;
  const { base, quote } = splitPool(poolKey);
  const poolLabel = poolKey.replace(/_/g, '/');

  const account = useSpotAccount(w.state === 'proposed' && w.hasBalanceManager ? poolKey : undefined);
  // Rebates are the canonical settled proceeds the indexer exposes. `locked` (funds reserved by resting
  // orders) is NOT proceeds, so we don't use it as a proxy — that mislabeled reserved funds as sweepable.
  const settled = account.data?.rebates ?? ZERO;
  const parts = proceedsParts(settled, base, quote);
  const proceedsText = parts.length ? fmtProceeds(parts) : '';

  if (w.dismissed) return null;

  const docNumber = `DB·${part.toolCallId.slice(0, 4).toUpperCase()}·${part.toolCallId.slice(-4)}`;

  // Terminal states render the receipt (title + Pool/Proceeds lines).
  if (w.state !== 'proposed') {
    const lines: ReceiptLine[] = [
      { label: 'Pool', value: poolLabel },
      { label: 'Proceeds', value: proceedsText || `${poolLabel} balances`, strong: true, accent: true },
    ];
    return (
      <SignReceipt
        state={w.state}
        title="Sweep settled proceeds"
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

  // No BalanceManager → can't sweep. Resolve the tool call via Dismiss so the assistant turn never
  // wedges (and Retry on a resolver blip, not "create" which could orphan a second manager).
  if (!w.hasBalanceManager && !w.bmLoading) {
    return (
      <div className="flex w-full flex-col gap-3 rounded-card border border-dashed border-[#CBC6BB] bg-[#FBFAF7] px-[15px] py-3.5">
        <span className="text-[12.5px] text-muted">
          {w.bmError
            ? 'Couldn’t reach your account — retry in a moment.'
            : `Open a DeepBook account first to sweep ${poolLabel} proceeds.`}
        </span>
        <div className="flex gap-2.5">
          {w.bmError && (
            <button
              type="button"
              onClick={w.bmRefetch}
              className="rounded-[9px] border border-line-strong px-4 py-2 text-[12px] font-semibold text-ink transition hover:bg-paper"
            >
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={w.cancel}
            className="rounded-[9px] border border-line-strong px-4 py-2 text-[12px] font-semibold text-[#7d7870] transition hover:bg-paper"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Still resolving the account read — hold space rather than flash an empty state.
  if (account.isLoading) {
    return (
      <div className="flex h-[88px] w-full items-center gap-[11px] rounded-card border border-[#C9D8CF] bg-[#F8FBF8] px-[15px]">
        <span className="size-[34px] flex-none animate-pulse rounded-[9px] bg-[#E3EDE6]" />
        <div className="flex-1 space-y-1.5">
          <span className="block h-3 w-28 animate-pulse rounded bg-[#E3EDE6]" />
          <span className="block h-2.5 w-40 animate-pulse rounded bg-[#EAF1EC]" />
        </div>
      </div>
    );
  }

  // A failed read must NOT be shown as "nothing to sweep" — that would hide real proceeds + the action.
  if (account.isError) {
    return (
      <button
        type="button"
        onClick={() => void account.refetch()}
        className="flex w-full items-center justify-between gap-2.5 rounded-card border border-dashed border-[#CBC6BB] bg-[#FBFAF7] px-[15px] py-3.5 text-left transition hover:bg-paper"
      >
        <span className="text-[12.5px] text-muted">
          Couldn’t check settled proceeds on <span className="font-semibold text-ink-soft">{poolLabel}</span>.
        </span>
        <span className="flex-none text-[11.5px] font-semibold text-ink underline underline-offset-2">Retry</span>
      </button>
    );
  }

  // Nothing settled → the "hidden"/empty state: a quiet, un-actionable note (only on a successful read).
  if (account.isSuccess && parts.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-card border border-dashed border-[#CBC6BB] bg-[#FBFAF7] px-[15px] py-3.5">
        <span className="flex size-5 flex-none items-center justify-center rounded-full border border-line-strong text-[11px] text-faint">
          ✓
        </span>
        <span className="text-[12.5px] text-muted">
          Nothing to sweep on <span className="font-semibold text-ink-soft">{poolLabel}</span> — all proceeds are settled.
        </span>
      </div>
    );
  }

  // No-BM is handled above, so a BalanceManager always exists by here.
  const onSweep = () => void w.sign({ poolKey });

  return (
    <div className="w-full rounded-card border border-[#C9D8CF] bg-[#F8FBF8] px-[15px] py-[13px]">
      <div className="flex items-center gap-[11px]">
        <span className="flex size-[34px] flex-none items-center justify-center rounded-[9px] bg-[#E3EDE6]">
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
            <path
              d="M12 3v12m0 0l-5-5m5 5l5-5M4 21h16"
              fill="none"
              stroke="#2C5E4A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-ink">Unswept proceeds</div>
          <div className="truncate font-mono text-[11.5px] tabular-nums text-green">{proceedsText}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSweep}
        className="mt-3 w-full rounded-[9px] bg-green py-[11px] text-[13px] font-semibold text-white transition hover:opacity-90"
      >
        Sweep to balance manager
      </button>
    </div>
  );
}
