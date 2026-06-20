'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ConnectModal, useCurrentAccount } from '@mysten/dapp-kit';
import { useTxAction, type TxStatus } from '@/lib/hooks/useTxAction';
import { useBalanceManager } from '@/lib/hooks/useBalanceManager';
import { useSpotBalance } from '@/lib/hooks/useSpotRead';
import { CoinLogo } from '@/components/widgets/CoinLogo';
import { SUISCAN_OBJECT, SUISCAN_TX } from '@/lib/constants';
import { formatAddress, formatUsd } from '@/lib/format';
import { SPOT_COIN_KEYS, type SpotCoinKey } from '@/lib/bff/spot-types';

const SUMMARY_COINS: SpotCoinKey[] = ['SUI', 'DBUSDC', 'DEEP'];

function StatusLine({ status, digest, reason }: { status: TxStatus; digest: string | null; reason: string | null }) {
  if (status === 'signing') return <p className="text-[12px] text-muted">Signing in your wallet…</p>;
  if (status === 'error') return <p className="text-[12px] text-clay">{reason}</p>;
  if (status === 'done' && digest)
    return (
      <a
        href={SUISCAN_TX(digest)}
        target="_blank"
        rel="noreferrer"
        className="text-[12px] font-semibold text-green underline underline-offset-2"
      >
        Confirmed — view on Suiscan ↗
      </a>
    );
  return null;
}

/** One held-coin row inside the ink summary. Calls the per-coin balance hook (can't loop hooks). */
function CoinRow({ coinKey }: { coinKey: SpotCoinKey }) {
  const { data } = useSpotBalance(coinKey);
  const bal = data?.balance ?? 0;
  return (
    <div className="flex items-center px-[18px] py-[9px]">
      <CoinLogo asset={coinKey} size={20} />
      <span className="ml-[9px] text-[13px] font-semibold">{coinKey}</span>
      <span className="ml-auto font-mono text-[13px] tabular-nums">{formatUsd(bal, bal >= 1000 ? 1 : 2)}</span>
    </div>
  );
}

/** The spot trading account: connect prompt · create · or live summary + deposit/withdraw. */
export function BalanceManagerPanel({ onAction }: { onAction?: (text: string) => void }) {
  const account = useCurrentAccount();
  const bm = useBalanceManager(account?.address);
  const qc = useQueryClient();
  const create = useTxAction();
  const move = useTxAction();
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [coin, setCoin] = useState<SpotCoinKey>('DBUSDC');
  const [amount, setAmount] = useState('');

  const managerId = bm.data?.balanceManagerId ?? null;
  const amt = Number(amount);
  const busy = create.status === 'signing' || move.status === 'signing';

  function refresh() {
    qc.invalidateQueries({ queryKey: ['spot'] });
    qc.invalidateQueries({ queryKey: ['balanceManager'] });
  }

  // ── (1) not connected ──────────────────────────────────────────────────────
  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center gap-[13px] rounded-card border border-line bg-card p-5 text-center">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#F2EEE6]">
          <span className="h-4 w-4 rounded-[5px] bg-[#4DA2FF]" />
        </span>
        <div>
          <div className="text-[14px] font-bold">Connect your wallet</div>
          <p className="mt-0.5 text-[12px] leading-snug text-muted">Spot balances live in a BalanceManager tied to your wallet.</p>
        </div>
        <ConnectModal
          trigger={
            <button type="button" className="rounded-[9px] bg-ink px-[22px] py-[11px] text-[13.5px] font-semibold text-paper transition hover:opacity-90">
              Connect wallet
            </button>
          }
        />
      </div>
    );
  }

  // ── (2a) resolver failed (transient) ───────────────────────────────────────
  // A network/RPC failure resolving the BalanceManager is NOT "no account". Offering "Create one"
  // here would let the user mint a SECOND shared BalanceManager and orphan funds in the first, so
  // show a retry instead. (The error flag is plumbed from /api/spot/balance-manager.)
  if (!bm.isLoading && managerId == null && bm.data?.error) {
    return (
      <div className="flex flex-col justify-center gap-[11px] rounded-card border border-line bg-card p-5">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">Spot account</div>
        <div className="text-[15px] font-bold leading-tight tracking-[-0.02em]">Couldn’t reach your account</div>
        <p className="text-[12px] leading-relaxed text-muted">
          We couldn’t check for your BalanceManager just now — usually a brief network hiccup. Retry in a moment;
          don’t create a new one or you may end up with two.
        </p>
        <button
          type="button"
          onClick={() => void bm.refetch()}
          className="mt-0.5 rounded-[9px] border border-line-strong py-3 text-[13.5px] font-semibold text-ink transition hover:bg-paper"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── (2) no BalanceManager ──────────────────────────────────────────────────
  if (!bm.isLoading && managerId == null) {
    return (
      <div className="flex flex-col justify-center gap-[11px] rounded-card border border-line bg-card p-5">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">Spot account</div>
        <div className="text-[16px] font-bold leading-tight tracking-[-0.02em]">
          No BalanceManager
          <br />
          on this wallet yet
        </div>
        <p className="text-[12px] leading-relaxed text-muted">
          Create one to deposit coins, swap, and place orders. A one-time on-chain setup.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void create.run('spot_create_balance_manager', {}, {}).then((d) => d && refresh())}
          className="mt-0.5 rounded-[9px] bg-green py-3 text-[13.5px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {create.status === 'signing' ? 'Creating…' : 'Create balance manager'}
        </button>
        <div className="min-h-[16px]">
          <StatusLine status={create.status} digest={create.digest} reason={create.reason} />
        </div>
      </div>
    );
  }

  // ── (3) live ───────────────────────────────────────────────────────────────
  async function doMove() {
    if (!(amt > 0) || !managerId) return;
    const tool = mode === 'deposit' ? 'spot_deposit' : 'spot_withdraw';
    const d = await move.run(tool, { coinKey: coin, amount: amt }, { balanceManagerId: managerId });
    if (d) {
      setAmount('');
      refresh();
      onAction?.(`${mode === 'deposit' ? 'Deposited' : 'Withdrew'} ${amt} ${coin}`);
    }
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card">
      <div className="bg-ink px-[18px] py-4 text-paper">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-[#a8a298]">BalanceManager</span>
          {managerId && (
            <a
              href={SUISCAN_OBJECT(managerId)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10.5px] text-[#a8a298] transition hover:text-paper"
            >
              {formatAddress(managerId)} ↗
            </a>
          )}
        </div>
        <div className="font-mono text-[14px] font-medium tabular-nums tracking-[-0.01em] text-[#cfcabf]">
          {bm.isLoading ? 'Resolving account…' : 'Account ready'}
        </div>
        <p className="mt-0.5 text-[11.5px] text-[#a8a298]">Balances held inside your DeepBook account</p>
      </div>

      <div className="py-1.5">
        {SUMMARY_COINS.map((c) => (
          <CoinRow key={c} coinKey={c} />
        ))}
      </div>

      <div className="border-t border-[#EDE9E0] p-[15px]">
        <div className="mb-3 flex items-center gap-4">
          {(['deposit', 'withdraw'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`text-[14px] font-bold capitalize transition ${
                mode === m ? 'text-ink' : 'border-b-[1.3px] border-[#c2bcb0] pb-px text-[11.5px] text-muted'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mb-3 rounded-[9px] border border-line bg-[#FBFAF7] px-[13px] py-[11px]">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">Amount</span>
            <select
              value={coin}
              onChange={(e) => setCoin(e.target.value as SpotCoinKey)}
              className="rounded-pill border border-line bg-card px-2 py-1 text-[12px] font-bold outline-none focus:border-ink"
            >
              {SPOT_COIN_KEYS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            className="w-full bg-transparent font-mono text-[20px] font-semibold tabular-nums outline-none placeholder:text-faint"
          />
        </div>

        <div className="flex justify-between py-1 text-[13px]">
          <span className="text-[#7d7870]">Account</span>
          <span className="font-mono font-medium">{formatAddress(managerId)}</span>
        </div>

        <button
          type="button"
          disabled={busy || !(amt > 0) || !managerId}
          onClick={() => void doMove()}
          className="mt-2 w-full rounded-[9px] bg-green py-3 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {move.status === 'signing'
            ? `${mode === 'deposit' ? 'Depositing' : 'Withdrawing'}…`
            : `${mode === 'deposit' ? 'Deposit' : 'Withdraw'}${amt > 0 ? ` ${amount} ${coin}` : ''}`}
        </button>
        <div className="mt-2 min-h-[16px]">
          <StatusLine status={move.status} digest={move.digest} reason={move.reason} />
        </div>
      </div>
    </div>
  );
}
