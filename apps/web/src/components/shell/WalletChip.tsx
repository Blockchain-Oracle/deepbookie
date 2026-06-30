'use client';

import { useEffect, useRef, useState } from 'react';
import { ConnectModal, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { useBalances } from '@/lib/hooks/useBalances';
import { SUISCAN_ACCOUNT } from '@/lib/constants';
import { formatAddress, formatUsd } from '@/lib/format';

/** Wallet area: a compact Connect trigger (stock modal) or the connected account chip + dropdown. */
export function WalletChip() {
  const account = useCurrentAccount();
  const { dusdc, sui, deep } = useBalances();
  const { mutate: disconnect } = useDisconnectWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!account) {
    return (
      <ConnectModal
        trigger={
          <button
            type="button"
            className="shrink-0 whitespace-nowrap rounded-card-in bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper transition hover:opacity-90"
          >
            Connect Wallet
          </button>
        }
      />
    );
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-pill border border-line bg-card py-1 pl-1.5 pr-2.5 transition hover:bg-paper"
      >
        <span className="size-4 shrink-0 rounded-[4px] bg-wallet" />
        <span className="font-mono text-xs text-ink-soft">{formatAddress(account.address)}</span>
        <span className="hidden h-3.5 w-px bg-line sm:block" />
        <span className="hidden font-mono text-xs font-semibold tabular-nums sm:inline">
          {dusdc.data != null ? `${formatUsd(dusdc.data)} dUSDC` : '—'}
        </span>
        <span className={`text-[9px] text-faint transition ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-card border border-line-strong bg-card shadow-[var(--shadow-float)]">
          <div className="border-b border-line px-3 py-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
              Balances
            </div>
            <BalanceRow label="dUSDC" value={dusdc.data != null ? formatUsd(dusdc.data) : null} primary />
            <BalanceRow label="SUI" value={sui.data != null ? formatTokenAmount(sui.data) : null} />
            <BalanceRow label="DEEP" value={deep.data != null ? formatTokenAmount(deep.data) : null} />
          </div>
          <MenuItem
            onClick={() => {
              void navigator.clipboard?.writeText(account.address);
              setOpen(false);
            }}
          >
            Copy address
          </MenuItem>
          <a
            href={SUISCAN_ACCOUNT(account.address)}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="block px-3 py-2.5 text-[13px] text-ink-soft transition hover:bg-paper"
          >
            View on Suiscan ↗
          </a>
          <MenuItem
            danger
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
          >
            Disconnect
          </MenuItem>
        </div>
      )}
    </div>
  );
}

/** One balance row in the dropdown: label left, amount right (tabular-nums for alignment). `primary`
 *  styles dUSDC slightly bolder so the user's "tradeable" balance reads first; SUI/DEEP are smaller
 *  utility rows beneath it. A null value renders as '—' (loading / disconnected). */
function BalanceRow({ label, value, primary }: { label: string; value: string | null; primary?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between ${primary ? '' : 'mt-1'}`}>
      <span
        className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${primary ? 'text-ink-soft' : 'text-faint'}`}
      >
        {label}
      </span>
      <span
        className={`font-mono tabular-nums ${primary ? 'text-sm font-bold text-ink' : 'text-[12px] font-semibold text-ink-soft'}`}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

/** Token-amount formatter — keeps DEEP/SUI to ~4 dp max, trims trailing zeros via toLocaleString. */
function formatTokenAmount(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-3 py-2.5 text-left text-[13px] transition hover:bg-paper ${
        danger ? 'text-clay' : 'text-ink-soft'
      }`}
    >
      {children}
    </button>
  );
}
