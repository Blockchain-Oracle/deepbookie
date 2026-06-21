'use client';

import { ConnectButton } from '@mysten/dapp-kit';
import { BrandMark } from '@/components/ui/BrandMark';

export function ConnectScreen() {
  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-card border border-line-strong shadow-[var(--shadow-float)] md:grid-cols-2">
      <div className="flex flex-col justify-between gap-10 bg-ink p-10 text-paper">
        <div className="flex items-center gap-3">
          <BrandMark size={22} />
          <span className="text-lg font-bold tracking-[-0.03em]">DeepBookie</span>
          <span className="rounded-card-in border border-[#2c2823] px-2 py-1 font-mono text-[10px] tracking-[0.06em] text-[#7d8a82]">
            SUI TESTNET
          </span>
        </div>
        <div>
          <h2 className="text-4xl font-extrabold leading-[1.0] tracking-[-0.04em]">
            Trade DeepBook
            <br />
            just by
            <br />
            <span className="text-mint">chatting.</span>
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#cfc9bd]">
            Connect your Sui wallet to start trading. DeepBookie builds the trade — you sign every
            one in your own wallet.
          </p>
        </div>
        <div className="font-mono text-xs text-[#6b675e]">you sign every trade</div>
      </div>

      <div className="flex flex-col justify-center gap-4 bg-paper p-10">
        <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">
          Choose a wallet
        </div>
        <ConnectButton />
        <p className="max-w-sm text-xs leading-relaxed text-muted">
          By connecting you agree to the testnet terms. No real funds are ever at risk.
        </p>
      </div>
    </div>
  );
}
