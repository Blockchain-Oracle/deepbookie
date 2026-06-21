'use client';

import { SUISCAN_TX } from '@/lib/constants';
import { docNumberFor, shortenDigest } from '@/lib/format';

/**
 * A read-only, hook-free summary of a tool call — used when replaying an ARCHIVED chat (History or a
 * stale session). Archived chats must never mount the live interactive cards (they fire network reads
 * → freeze, and show Sign/Deposit buttons that shouldn't be clickable). This renders a static record
 * of what the action was and how it ended (signed + digest / cancelled / failed / never signed).
 */
const TOOL_LABEL: Record<string, string> = {
  create_manager: 'Open trading account',
  mint: 'Place bet',
  redeem: 'Redeem',
  mint_range: 'Range bet',
  redeem_range: 'Settle range',
  supply: 'Provide vault liquidity',
  withdraw: 'Withdraw vault liquidity',
  spot_create_balance_manager: 'Open DeepBook account',
  spot_deposit: 'Deposit',
  spot_withdraw: 'Withdraw',
  spot_cancel_order: 'Cancel order',
  spot_cancel_all_orders: 'Cancel all orders',
  spot_swap_base_for_quote: 'Swap',
  spot_swap_quote_for_base: 'Swap',
  spot_place_limit_order: 'Limit order',
  spot_modify_order: 'Reduce order',
  spot_stake: 'Stake DEEP',
  spot_unstake: 'Unstake DEEP',
  spot_submit_proposal: 'Fee proposal',
  spot_vote: 'Vote',
  spot_claim_rebates: 'Claim rebates',
  spot_withdraw_settled_amounts: 'Sweep proceeds',
};

interface StaticPart {
  type: string;
  state?: string;
  output?: unknown;
  toolCallId: string;
}

export function StaticToolReceipt({ part }: { part: StaticPart }) {
  const name = part.type.slice('tool-'.length);
  const label = TOOL_LABEL[name] ?? name.replace(/_/g, ' ');
  const out = (part.output ?? {}) as { digest?: string; status?: string };
  const digest = out.digest;
  const signed = !!digest;
  const cancelled = !signed && out.status === 'cancelled';
  const failed = !signed && !cancelled && part.state === 'output-error';

  const badge = signed ? 'Signed' : cancelled ? 'Cancelled' : failed ? 'Failed' : 'Not signed';
  const tone = signed ? 'text-green border-[#C9D8CF]' : failed ? 'text-clay border-[#E6C9BE]' : 'text-[#a8a298] border-line-strong';

  return (
    <div className={`rounded-card border bg-card px-4 py-3 ${signed ? 'border-[#C9D8CF]' : failed ? 'border-[#E6C9BE]' : 'border-dashed border-[#D8CFC2] opacity-90'}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">{label}</span>
        <span className={`rounded-pill border px-2 py-0.5 font-mono text-[9.5px] ${tone}`}>{badge}</span>
      </div>
      {signed && (
        <div className="mt-2 flex items-center justify-between rounded-card-in border border-line bg-[#FAFAF7] px-3 py-2">
          <span className="font-mono text-[11px] text-ink-soft">{shortenDigest(digest)}</span>
          <a
            href={SUISCAN_TX(digest)}
            target="_blank"
            rel="noreferrer"
            className="border-b-[1.3px] border-green text-[11.5px] font-semibold text-green"
          >
            Suiscan ↗
          </a>
        </div>
      )}
      <div className="mt-1.5 font-mono text-[9.5px] text-faint">{docNumberFor(part.toolCallId)}</div>
    </div>
  );
}

/** Hook-firing read widgets (balances, positions, pools, orders) fire live network reads + would
 *  freeze an archived view — render a quiet static "viewed" stub instead. */
const READ_LABEL: Record<string, string> = {
  get_positions: 'Your positions',
  spot_account: 'DeepBook account',
  spot_list_pools: 'Spot pools',
  spot_open_orders: 'Open orders',
};

export function StaticReadStub({ name }: { name: string }) {
  return (
    <div className="rounded-card border border-line bg-[#FBFAF7] px-4 py-2.5 text-[12px] text-muted">
      {READ_LABEL[name] ?? name.replace(/_/g, ' ')} · <span className="text-faint">viewed earlier</span>
    </div>
  );
}

/** Reads whose widgets fire live hooks (network/polling) — replaced by a static stub in read-only. */
export const HOOK_FIRING_READS = new Set(['get_positions', 'spot_account', 'spot_list_pools', 'spot_open_orders']);
