/**
 * The chat-home launcher categories (from Components-ChatHome.dc.html). Each card sends its starter
 * `prompt` to the agent (which replies with the real widget) — except History, which navigates to a
 * page via `href`. `needsWallet` cards show the disabled "Connect wallet to use" state pre-connect.
 * All nine map to real tools — see lib/ai/tools.ts.
 */
export type MotifKind =
  | 'oddsCurve'
  | 'upDown'
  | 'swap'
  | 'depth'
  | 'countUp'
  | 'vaultStack'
  | 'stakeBadge'
  | 'govTags'
  | 'receipt';

export interface Category {
  id: string;
  title: string;
  /** Rail-card description (fuller). */
  description: string;
  /** Mobile-tile description (terser). */
  mobileDesc: string;
  /** Starter prompt sent to the agent on tap (omitted for href cards). */
  prompt?: string;
  /** Navigates instead of prompting (History → /history). */
  href?: string;
  /** Family tag text, e.g. "Predict", "Spot", "Account". */
  familyLabel: string;
  /** Tailwind bg class for the family dot. */
  dot: string;
  motif: MotifKind;
  /** Renders the pulsing LIVE badge (Markets & odds). */
  isLive?: boolean;
  /** Disabled "Connect wallet to use" state when no wallet is connected. */
  needsWallet?: boolean;
}

export const CATEGORIES: Category[] = [
  {
    id: 'markets',
    title: 'Markets & odds',
    description: 'See live BTC odds, priced off a volatility model.',
    mobileDesc: 'Live BTC odds.',
    prompt: 'What are the live BTC odds?',
    familyLabel: 'Predict',
    dot: 'bg-green',
    motif: 'oddsCurve',
    isLive: true,
    needsWallet: true,
  },
  {
    id: 'place-bet',
    title: 'Place a bet',
    description: 'Bet UP or DOWN on BTC at expiry — you sign it.',
    mobileDesc: 'Bet UP or DOWN — you sign it.',
    prompt: 'Place a $5 UP bet on BTC.',
    familyLabel: 'Predict',
    dot: 'bg-green',
    motif: 'upDown',
    needsWallet: true,
  },
  {
    id: 'swap',
    title: 'Swap',
    description: 'Swap tokens on the DeepBook order book.',
    mobileDesc: 'Swap tokens on DeepBook.',
    prompt: 'Swap 0.5 SUI to DBUSDC.',
    familyLabel: 'Spot',
    dot: 'bg-wallet',
    motif: 'swap',
    needsWallet: true,
  },
  {
    id: 'orders',
    title: 'Orders & liquidity',
    description: "A limit order is providing liquidity. It's a CLOB.",
    mobileDesc: 'Limit order = provide liquidity.',
    prompt: 'Place a limit buy for 1 SUI at 4.20.',
    familyLabel: 'Spot',
    dot: 'bg-wallet',
    motif: 'depth',
    needsWallet: true,
  },
  {
    id: 'account',
    title: 'Your account',
    description: 'Balance, open positions and live PnL.',
    mobileDesc: 'Balance, positions, PnL.',
    prompt: "What's my balance and open positions?",
    familyLabel: 'Account',
    dot: 'bg-mint',
    motif: 'countUp',
    needsWallet: true,
  },
  {
    id: 'vault',
    title: 'Vault',
    description: 'Provide vault liquidity, earn the house spread.',
    mobileDesc: 'Provide liquidity, earn spread.',
    prompt: 'How does the vault work?',
    familyLabel: 'Predict · PLP',
    dot: 'bg-green',
    motif: 'vaultStack',
    needsWallet: true,
  },
  {
    id: 'stake',
    title: 'Stake DEEP',
    description: 'Stake for fee discounts and pool voting power.',
    mobileDesc: 'Fee discounts + voting.',
    prompt: 'Stake 1 DEEP in the SUI/DBUSDC pool.',
    familyLabel: 'Spot',
    dot: 'bg-wallet',
    motif: 'stakeBadge',
    needsWallet: true,
  },
  {
    id: 'governance',
    title: 'Governance',
    description: 'Propose fees, vote your stake, claim rebates.',
    mobileDesc: 'Propose, vote, claim.',
    prompt: 'Show governance for the SUI/DBUSDC pool.',
    familyLabel: 'Spot',
    dot: 'bg-ink',
    motif: 'govTags',
    needsWallet: true,
  },
  {
    id: 'history',
    title: 'History',
    description: 'Replay your signed sessions and receipts.',
    mobileDesc: 'Replay signed sessions.',
    prompt: 'Show my recent sessions.',
    href: '/history',
    familyLabel: 'History',
    dot: 'bg-faint',
    motif: 'receipt',
  },
];
