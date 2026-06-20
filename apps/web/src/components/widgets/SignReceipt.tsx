'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import type { Direction } from '@/lib/bff/types';
import { formatUsd, shortenDigest } from '@/lib/format';

export type ReceiptState = 'loading' | 'proposed' | 'signing' | 'signed' | 'failed' | 'cancelled';

export interface SignReceiptProps {
  state: ReceiptState;
  title: string; // e.g. "BTC above $63,000"
  direction: Direction;
  quantity: number;
  costUsd: number;
  maxPayoutUsd: number;
  docNumber: string; // e.g. DB·7F3A·0112
  settleNote?: string; // e.g. "Binary · settles in 27 minutes"
  signedAt?: string;
  digest?: string;
  reason?: string; // failure reason (required visible in failed state)
  suiscanUrl?: string;
  onAuthorize?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
}

function DirectionBadge({ direction, muted }: { direction: Direction; muted?: boolean }) {
  const up = direction === 'UP';
  const color = muted ? 'border-[#d8cfc2] text-[#a8a298]' : up ? 'border-green text-green' : 'border-clay text-clay';
  return (
    <span className={`rounded-[5px] border px-2 py-0.5 text-[11px] font-bold ${color}`}>
      {direction} {up ? '↑' : '↓'}
    </span>
  );
}

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 text-[13px] ${strong ? 'border-t border-line pt-2.5' : ''}`}>
      <span className={strong ? 'font-bold text-ink' : 'text-[#7d7870]'}>{label}</span>
      <span className={`font-mono tabular-nums ${strong ? 'font-bold' : 'font-medium'} ${accent ? 'text-green' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}

function Stamp() {
  return (
    <div
      className="absolute right-4 top-[54px] flex size-[60px] rotate-[-9deg] flex-col items-center justify-center rounded-full border-[1.4px] border-green opacity-90"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="#2C5E4A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-mono text-[6.5px] font-semibold tracking-[0.1em] text-green">SIGNED</span>
    </div>
  );
}

export function SignReceipt(p: SignReceiptProps) {
  if (p.state === 'loading') {
    return (
      <div className="overflow-hidden rounded-card border border-line bg-card">
        <Skeleton className="h-[3px] rounded-none" />
        <div className="space-y-2 p-4">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="mt-3 h-11 w-full" />
        </div>
      </div>
    );
  }

  if (p.state === 'cancelled') {
    return (
      <div className="rounded-card border border-dashed border-[#D8CFC2] bg-[#FBFAF7] p-4 opacity-90">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#a8a298]">Trade confirmation</span>
          <span className="rounded-pill border border-line-strong px-2 py-0.5 font-mono text-[9.5px] text-[#a8a298]">CANCELLED</span>
        </div>
        <div className="flex items-baseline gap-2">
          <DirectionBadge direction={p.direction} muted />
          <span className="text-base font-bold text-[#7d7870] line-through">{p.title}</span>
        </div>
        <div className="mt-2 text-xs text-[#a8a298]">You declined this proposal — nothing was signed.</div>
      </div>
    );
  }

  const ruleColor = p.state === 'signed' ? 'bg-green' : p.state === 'failed' ? 'bg-clay' : 'bg-ink';
  const kickerColor = p.state === 'signed' ? 'text-green' : p.state === 'failed' ? 'text-clay' : 'text-ink';
  const border = p.state === 'signed' ? 'border-[#C9D8CF]' : p.state === 'failed' ? 'border-[#E6C9BE]' : 'border-ink';
  const sub =
    p.state === 'signed' ? `Signed · ${p.signedAt ?? 'just now'}` : p.state === 'signing' ? 'Signing…' : p.state === 'failed' ? 'Not signed' : 'Awaiting your signature';

  return (
    <div className={`relative overflow-hidden rounded-card border bg-card ${border}`}>
      <div className={`h-[3px] ${ruleColor}`} />
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <div className={`text-[10px] font-semibold uppercase tracking-[0.13em] ${kickerColor}`}>Trade confirmation</div>
          <div className="mt-0.5 text-[11.5px] text-muted">{sub}</div>
        </div>
        <span className="font-mono text-[10px] text-faint">{p.docNumber}</span>
      </div>

      {p.state === 'signed' && <Stamp />}

      <div className={`px-4 pb-1 pt-3.5 ${p.state === 'signing' || p.state === 'failed' ? 'opacity-60' : ''}`}>
        <div className="mb-1.5 flex items-baseline gap-2">
          <DirectionBadge direction={p.direction} />
          <span className="text-[17px] font-bold tracking-[-0.02em]">{p.title}</span>
        </div>
        {p.settleNote && <div className="mb-2 text-xs text-muted">{p.settleNote}</div>}
        <Row label={p.state === 'signed' ? 'Quantity · paid' : 'Quantity'} value={p.state === 'signed' ? `${formatUsd(p.quantity)} · ${formatUsd(p.costUsd)}` : `${formatUsd(p.quantity)} contracts`} />
        {p.state !== 'signed' && <Row label="Cost + fee" value={`${formatUsd(p.costUsd)} dUSDC`} />}
        <Row label="Max payout if right" value={`${formatUsd(p.maxPayoutUsd)} dUSDC`} strong accent />
      </div>

      {p.state === 'signing' && (
        <div className="flex items-center justify-center gap-3 px-4 py-4">
          <span className="size-5 animate-spin rounded-full border-[2.5px] border-line-strong border-t-ink" />
          <span className="text-[13px] font-medium text-[#7d7870]">Confirm in your wallet…</span>
        </div>
      )}

      {p.state === 'proposed' && (
        <div className="flex gap-2.5 px-4 pb-4 pt-2">
          <button type="button" onClick={p.onAuthorize} className="flex-1 rounded-card-in bg-ink py-3 text-sm font-semibold text-paper transition hover:opacity-90">
            Authorize &amp; sign
          </button>
          <button type="button" onClick={p.onCancel} className="rounded-card-in border border-line-strong px-5 py-3 text-sm font-semibold text-[#7d7870] transition hover:bg-paper">
            Cancel
          </button>
        </div>
      )}

      {p.state === 'signed' && (
        <div className="mx-4 mb-4 mt-1.5 flex items-center justify-between rounded-card-in border border-line bg-[#FAFAF7] px-3 py-2.5">
          <span className="font-mono text-[11px] text-ink-soft">{p.digest ? shortenDigest(p.digest) : '—'}</span>
          {p.suiscanUrl && (
            <a href={p.suiscanUrl} target="_blank" rel="noreferrer" className="border-b-[1.3px] border-green text-[11.5px] font-semibold text-green">
              Suiscan ↗
            </a>
          )}
        </div>
      )}

      {p.state === 'failed' && (
        <div className="px-4 pb-4 pt-1">
          <div className="mb-3 text-[12.5px] leading-snug text-[#a06550]">{p.reason ?? 'The transaction was rejected. No funds moved.'}</div>
          <div className="flex gap-2.5">
            <button type="button" onClick={p.onRetry} className="flex-1 rounded-card-in bg-ink py-2.5 text-[13.5px] font-semibold text-paper transition hover:opacity-90">
              Try again
            </button>
            <button type="button" onClick={p.onDismiss} className="rounded-card-in border border-line-strong px-5 py-2.5 text-[13.5px] font-semibold text-[#7d7870] transition hover:bg-paper">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
