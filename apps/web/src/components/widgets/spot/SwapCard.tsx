'use client';

import { useMemo, useState } from 'react';
import { useSpotPoolParams, useSpotSwapQuote } from '@/lib/hooks/useSpotRead';
import { useSpotWriteCard } from '@/components/widgets/spot/useSpotWriteCard';
import type { AddToolResult, OnSignOutcome, WriteToolPart } from '@/components/widgets/ReceiptController';
import { SignReceipt, type ReceiptLine } from '@/components/widgets/SignReceipt';
import { SUISCAN_TX } from '@/lib/constants';
import { formatUsd } from '@/lib/format';

const SLIPPAGES = [0.5, 1] as const;
// Coin disc tints from the design system (Components-Spot.dc.html §2).
const COIN_BG: Record<string, string> = { SUI: '#4DA2FF', WAL: '#7d6f3a' };
const COIN_GLYPH: Record<string, string> = { DBUSDC: '$', DBUSDT: '$', DBTC: '₿' };

function CoinChip({ coin }: { coin: string }) {
  const glyph = COIN_GLYPH[coin] ?? coin.charAt(0);
  return (
    <div className="flex items-center gap-1.5 rounded-pill border border-line bg-card py-1 pl-1 pr-2.5">
      <span
        className="flex size-[18px] items-center justify-center rounded-full text-[9px] font-bold text-paper"
        style={{ background: COIN_BG[coin] ?? '#1A1714' }}
      >
        {glyph}
      </span>
      <span className="text-[12.5px] font-bold text-ink">{coin}</span>
    </div>
  );
}

export function SwapCard({
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
  const isSellBase = w.toolName === 'spot_swap_base_for_quote';

  const poolKey = String((w.proposed as { poolKey?: unknown }).poolKey ?? '');
  const [from, to] = useMemo(() => {
    const [base = 'BASE', quote = 'QUOTE'] = poolKey.split('_');
    return isSellBase ? [base, quote] : [quote, base];
  }, [poolKey, isSellBase]);

  const seeded = Number((w.proposed as { amount?: unknown }).amount ?? 0);
  const [amount, setAmount] = useState(seeded > 0 ? String(seeded) : '');
  const [slip, setSlip] = useState<number>(SLIPPAGES[0]);
  const amt = Number(amount) || 0;

  const params = useSpotPoolParams(poolKey || undefined);
  const whitelisted = params.data?.whitelisted ?? false;
  const quote = useSpotSwapQuote(
    amt > 0 && poolKey
      ? { poolKey, ...(isSellBase ? { baseQuantity: amt } : { quoteQuantity: amt }) }
      : undefined,
  );

  const out = quote.data ? (isSellBase ? quote.data.quoteOut : quote.data.baseOut) : 0;
  const deepRequired = quote.data?.deepRequired ?? 0;
  const minOut = out * (1 - slip / 100);
  // Rate label is always "1 {from} = rate {to}" → receive(out) per pay(amt), both directions.
  const rate = amt > 0 && out > 0 ? out / amt : 0;
  const quoting = quote.isFetching && amt > 0;
  const emptyBook = amt > 0 && quote.data != null && out <= 0;
  const docNumber = `DB·${part.toolCallId.slice(0, 4).toUpperCase()}·${part.toolCallId.slice(-4)}`;

  if (w.dismissed) return null;

  if (w.state !== 'proposed') {
    const lines: ReceiptLine[] = [
      { label: 'Rate', value: `1 ${from} = ${formatUsd(rate, 4)} ${to}` },
      { label: `Min received · ${slip}%`, value: `${formatUsd(minOut, out >= 1000 ? 2 : 4)} ${to}` },
      {
        label: 'Fee',
        value: whitelisted ? 'from input coin' : `${formatUsd(deepRequired, 4)} DEEP`,
        strong: true,
      },
    ];
    return (
      <SignReceipt
        state={w.state}
        title={`Swap ${from} → ${to}`}
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

  const cta = emptyBook ? 'No liquidity' : quoting ? 'Fetching quote…' : 'Swap';
  const canSwap = amt > 0 && out > 0 && !quoting && !emptyBook;
  const fieldFrom = 'rounded-card-in border border-line bg-paper px-[13px] py-[11px]';

  return (
    <div className="rounded-card border border-line bg-card p-4">
      <div className="mb-3 flex items-center gap-[7px]">
        <span className="text-[14px] font-bold text-ink">Swap</span>
        {whitelisted ? (
          <span className="rounded-pill bg-mint/25 px-2 py-0.5 text-[10px] font-semibold text-green">
            {from}/{to} · DEEP-free
          </span>
        ) : (
          <span className="rounded-pill border border-line px-2 py-0.5 text-[10px] font-semibold text-muted">
            {from}/{to}
          </span>
        )}
      </div>

      {/* You pay */}
      <div className={`mb-1.5 ${fieldFrom}`}>
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-faint">You pay</div>
        <div className="flex items-center justify-between gap-3">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            className="w-full min-w-0 bg-transparent font-mono text-[21px] font-semibold tabular-nums text-ink outline-none placeholder:text-faint"
          />
          <CoinChip coin={from} />
        </div>
      </div>

      {/* direction glyph (decorative) */}
      <div className="relative z-[1] -my-[10px] flex justify-center">
        <div className="flex size-7 items-center justify-center rounded-card-in border border-line bg-card text-[14px] text-ink-soft shadow-[0_2px_6px_rgba(26,23,20,.08)]">
          ⇅
        </div>
      </div>

      {/* You receive */}
      <div className="mb-[13px] rounded-card-in border border-line bg-paper px-[13px] py-[11px]">
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-faint">You receive ≈</div>
        <div className="flex items-center justify-between gap-3">
          {quoting ? (
            <span className="flex items-center gap-2.5">
              <span className="size-[17px] animate-spin rounded-full border-[2px] border-line-strong border-t-ink" />
              <span className="font-mono text-[13px] text-faint">quoting…</span>
            </span>
          ) : (
            <span className={`font-mono text-[21px] font-semibold tabular-nums ${out > 0 ? 'text-green' : 'text-faint'}`}>
              {emptyBook ? '—' : formatUsd(out, out >= 1000 ? 2 : 4)}
            </span>
          )}
          <CoinChip coin={to} />
        </div>
      </div>

      {/* preview lines */}
      <Kv label="Rate" loading={quoting} value={`1 ${from} = ${formatUsd(rate, 4)}`} />
      <Kv label={`Min received · ${slip}%`} loading={quoting} value={formatUsd(minOut, out >= 1000 ? 2 : 4)} />
      <Kv
        label="Fee"
        loading={quoting}
        value={whitelisted ? `from ${from}` : `${formatUsd(deepRequired, 4)} DEEP`}
      />

      {/* slippage */}
      <div className="my-[9px] flex items-center gap-2 text-[11px] text-muted">
        <span className="h-px flex-1 bg-[#EDE9E0]" />
        Slippage
        <span className="flex gap-1.5">
          {SLIPPAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlip(s)}
              className={`rounded-pill px-2 py-0.5 text-[10.5px] font-semibold transition ${
                slip === s ? 'bg-ink text-paper' : 'border border-line text-muted hover:bg-paper'
              }`}
            >
              {s}%
            </button>
          ))}
        </span>
      </div>

      {emptyBook && (
        <div className="mb-3 text-center text-[12px] text-muted">
          This book is empty — place a limit order to make a market.
        </div>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={!canSwap}
          onClick={() =>
            w.sign({ poolKey, amount: amt, minOut, deepAmount: whitelisted ? 0 : deepRequired })
          }
          className={`flex-1 rounded-card-in py-[13px] text-[14.5px] font-semibold transition disabled:cursor-not-allowed ${
            canSwap ? 'bg-green text-paper hover:opacity-90' : 'bg-[#E9E5DC] text-faint'
          }`}
        >
          {cta}
        </button>
        <button
          type="button"
          onClick={w.cancel}
          className="rounded-card-in border border-line-strong px-5 py-[13px] text-[14px] font-semibold text-muted transition hover:bg-paper"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Kv({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="flex items-center justify-between py-[3px] text-[11.5px] text-muted">
      <span>{label}</span>
      {loading ? (
        <span className="h-[13px] w-[72px] animate-pulse rounded bg-[#EDE9E0]" />
      ) : (
        <span className="font-mono font-medium tabular-nums text-ink">{value}</span>
      )}
    </div>
  );
}
