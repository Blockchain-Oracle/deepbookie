'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTxAction, type TxStatus } from '@/lib/hooks/useTxAction';
import { useBalances } from '@/lib/hooks/useBalances';
import { SUISCAN_TX } from '@/lib/constants';
import { formatUsd } from '@/lib/format';
import type { Vault } from '@/lib/bff/types';
import type { PlpHolding } from '@/lib/hooks/usePlp';

const HOW_IT_WORKS =
  'You deposit dUSDC; the pool takes the other side of bets and earns the spread. Your PLP share ' +
  'price rises as the pool profits. Withdraw whenever liquidity is available — every supply and ' +
  'withdraw is a receipt you sign.';

function StatusLine({ status, digest, reason }: { status: TxStatus; digest: string | null; reason: string | null }) {
  if (status === 'signing') return <p className="text-[12px] text-muted">Signing in your wallet…</p>;
  if (status === 'error') return <p className="text-[12px] text-clay">{reason}</p>;
  if (status === 'done' && digest)
    return (
      <a href={SUISCAN_TX(digest)} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-green underline underline-offset-2">
        Confirmed — view on Suiscan ↗
      </a>
    );
  return null;
}

/** "Your position" + the supply/withdraw sign flows. Refreshes vault + PLP caches after a write. */
export function VaultManage({ vault, plp }: { vault: Vault; plp?: PlpHolding }) {
  const qc = useQueryClient();
  const supplyTx = useTxAction();
  const withdrawTx = useTxAction();
  const { dusdc } = useBalances();
  const [amount, setAmount] = useState('');

  const yourValue = (plp?.plpUnits ?? 0) * vault.plpSharePrice;
  const busy = supplyTx.status === 'signing' || withdrawTx.status === 'signing';

  function refresh() {
    qc.invalidateQueries({ queryKey: ['plp'] });
    qc.invalidateQueries({ queryKey: ['vault'] });
    qc.invalidateQueries({ queryKey: ['vaultHistory'] });
    void fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tags: ['vault'] }),
    }).catch(() => {});
  }

  async function doSupply() {
    const amt = Number(amount);
    if (!(amt > 0)) return;
    if (await supplyTx.run('supply', { amountUsd: amt })) {
      setAmount('');
      refresh();
    }
  }

  async function doWithdraw() {
    if (!plp?.firstCoinId) return;
    if (await withdrawTx.run('withdraw', { plpCoinId: plp.firstCoinId })) refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-[#DCEAE2] bg-[#F4F7F4] p-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-green">Your position</div>
        <div className="mt-1.5 font-mono text-[26px] font-extrabold tabular-nums tracking-[-0.02em]">
          {formatUsd(yourValue)} <span className="text-[14px] font-medium text-[#5a6f64]">dUSDC</span>
        </div>
        <div className="text-[12.5px] text-[#5a6f64]">
          {formatUsd(plp?.plpUnits ?? 0)} PLP · share price {vault.plpSharePrice.toFixed(4)}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="Amount (dUSDC)"
            className="min-w-0 flex-1 rounded-card-in border border-[#cdddd2] bg-card px-3 py-2.5 font-mono text-[13px] tabular-nums outline-none focus:border-green"
          />
          <button
            type="button"
            disabled={busy || !(Number(amount) > 0)}
            onClick={() => void doSupply()}
            className="rounded-card-in bg-green px-4 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Supply
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-[11px] text-[#7d8a82]">balance {formatUsd(dusdc.data ?? 0)} dUSDC</span>
          <button
            type="button"
            disabled={busy || !plp?.firstCoinId}
            onClick={() => void doWithdraw()}
            className="rounded-card-in border border-[#cdddd2] bg-card px-4 py-2 text-[13px] font-semibold text-green transition hover:bg-[#eef3ef] disabled:opacity-40"
          >
            Withdraw all
          </button>
        </div>
        <div className="mt-2 min-h-[16px]">
          <StatusLine status={supplyTx.status} digest={supplyTx.digest} reason={supplyTx.reason} />
          <StatusLine status={withdrawTx.status} digest={withdrawTx.digest} reason={withdrawTx.reason} />
        </div>
      </div>

      <div className="rounded-card border border-line bg-card p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">How it works</div>
        <p className="text-[13px] leading-relaxed text-[#615c53]">{HOW_IT_WORKS}</p>
      </div>
    </div>
  );
}
