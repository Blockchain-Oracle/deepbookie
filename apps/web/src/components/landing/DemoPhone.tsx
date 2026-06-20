'use client';

import { useEffect, useRef } from 'react';
import { BrandMark } from '@/components/ui/BrandMark';
import { runDemo, restingFrame } from './demoPhone.engine';
import { DEMO_PHONE_CSS } from './demoPhone.styles';

const Y_LABELS: [number, number, string][] = [
  [6, 11, '100'],
  [10, 47.5, '75'],
  [10, 83, '50'],
  [10, 118.5, '25'],
  [14, 153, '0'],
];
const RECEIPT_ROWS: [string, string][] = [
  ['Quantity', '100.00 contracts'],
  ['Implied probability', '53.8%'],
  ['Cost', '53.80 dUSDC'],
  ['Network fee', '0.27 dUSDC'],
];

/**
 * The animated hero phone — a self-contained looping demo of one chat turn:
 * the user asks, the agent reasons, an odds curve draws, then a receipt stamps
 * "SIGNED". Ported from the designer's scripted timeline. No chain calls, no
 * wallet hooks — every value is static and plausible (BTC ~$63k, a $54 UP bet).
 * Honors prefers-reduced-motion by rendering the final resting frame, no loop.
 */
export function DemoPhone() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      restingFrame(root);
      return;
    }
    return runDemo(root);
  }, []);

  return (
    <div className="flex flex-none flex-col items-center gap-4">
      <style>{DEMO_PHONE_CSS}</style>
      <div className="db-scaler">
        <div ref={rootRef} className="db-phone">
          <div className="db-frame">
            {/* TOP BAR */}
            <div className="relative z-[5] bg-paper">
              <div className="mono flex items-center justify-between px-7 pb-[3px] pt-[13px] text-[12px] font-semibold text-[#43403a]">
                <span>9:41</span>
                <div className="relative h-[9px] w-4 rounded-[2px] border border-[#43403a]">
                  <div className="absolute inset-[1.2px] w-[70%] rounded-[1px] bg-[#43403a]" />
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-line px-[18px] pb-[13px] pt-2">
                <div className="flex items-center gap-[9px]">
                  <BrandMark size={14} />
                  <span className="text-[16px] font-bold tracking-[-0.03em]">DeepBookie</span>
                </div>
                <div className="flex items-center gap-2 rounded-pill border border-line bg-card py-[5px] pl-[6px] pr-[11px]">
                  <div className="h-[18px] w-[18px] rounded-[5px] bg-wallet" />
                  <span className="mono text-[11.5px] text-[#43403a]">0x7a3f…4e21</span>
                </div>
              </div>
            </div>

            {/* SCROLL REGION */}
            <div data-anim="scroll" className="db-scroll">
              <div data-anim="camera" className="db-camera">
                <div data-anim="msgUser" className="db-msg-user">
                  Will BTC be above $63k in the next half hour?
                </div>

                <div data-anim="dots" className="db-dots">
                  <span style={{ animation: 'dbDot 1.1s infinite' }} />
                  <span style={{ animation: 'dbDot 1.1s infinite .18s' }} />
                  <span style={{ animation: 'dbDot 1.1s infinite .36s' }} />
                </div>

                <div data-anim="assistText" className="db-assist">
                  Spot is <span className="tnum font-semibold">$63,422.99</span> with about{' '}
                  <span className="font-semibold">27 minutes</span> to expiry. The model puts{' '}
                  <span className="font-semibold text-green">UP at $63,000 near 54%</span> — slightly
                  better than a coin flip. Here&apos;s the curve.
                </div>

                {/* odds curve card */}
                <div data-anim="curveCard" className="db-card-rise rounded-card border border-line bg-card px-4 pb-[13px] pt-4">
                  <div className="mb-[14px] flex items-center justify-between">
                    <div className="flex items-center gap-[9px]">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-paper">
                        ₿
                      </div>
                      <span className="text-[15px] font-bold">BTC</span>
                      <span className="tnum text-[13px] font-medium text-muted">$63,422.99</span>
                    </div>
                    <div className="flex items-center gap-[6px]">
                      <span className="h-[6px] w-[6px] rounded-full bg-green" style={{ animation: 'dbLive 2s infinite' }} />
                      <span className="mono text-[11px] font-medium text-green">27m left</span>
                    </div>
                  </div>
                  <div data-anim="chart">
                    <svg viewBox="0 0 360 184" className="block h-auto w-full">
                      {Y_LABELS.map(([x, y, t]) => (
                        <text key={t} x={x} y={y} className="mono" style={{ fontSize: 8.5, fill: '#c2bdb2' }}>
                          {t}
                        </text>
                      ))}
                      {[8, 43.5, 79, 114.5].map((y) => (
                        <line key={y} x1={30} y1={y} x2={358} y2={y} stroke="#F0ECE3" />
                      ))}
                      <line x1={30} y1={150} x2={358} y2={150} stroke="#E4DFD5" />
                      <defs>
                        <linearGradient id="dmg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#2C5E4A" stopOpacity="0.12" />
                          <stop offset="1" stopColor="#2C5E4A" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        data-anim="curveArea"
                        d="M30,29 C66,38 84,44 96,49 C128,60 149,68 161,72 C176,77 182,80 188,82 C206,89 215,87 224,91 C255,101 272,108 288,114 C316,123 336,129 358,132 L358,150 L30,150 Z"
                        fill="url(#dmg)"
                        style={{ opacity: 0, transition: 'opacity .6s ease .3s' }}
                      />
                      <path
                        data-anim="curvePath"
                        d="M30,29 C66,38 84,44 96,49 C128,60 149,68 161,72 C176,77 182,80 188,82 C206,89 215,87 224,91 C255,101 272,108 288,114 C316,123 336,129 358,132"
                        fill="none"
                        stroke="var(--color-green)"
                        strokeWidth={2}
                      />
                      <line x1={188} y1={8} x2={188} y2={150} stroke="#c2bcb0" strokeWidth={1} strokeDasharray="2 3" />
                      <line x1={161} y1={8} x2={161} y2={150} stroke="var(--color-ink)" strokeWidth={1} />
                      <g data-anim="marker" style={{ opacity: 0, transition: 'opacity .4s ease' }}>
                        <circle data-anim="ring" cx={161} cy={72} r={6} fill="var(--color-green)" opacity={0.5} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                        <circle cx={161} cy={72} r={4.5} fill="#fff" stroke="var(--color-green)" strokeWidth={2.5} />
                      </g>
                    </svg>
                    <div className="mono flex justify-between pl-[30px] pt-1 text-[9.5px] text-[#b0aa9f]">
                      <span>$61k</span>
                      <span>$63k</span>
                      <span>$64k</span>
                      <span>$66k</span>
                    </div>
                  </div>
                  <div className="mt-[14px] flex border-t border-[#EDE9E0] pt-[13px]">
                    <div className="flex-1">
                      <div className="db-lbl">Strike</div>
                      <div className="tnum mt-[3px] text-[16px] font-bold">$63,000</div>
                    </div>
                    <div className="flex-1">
                      <div className="db-lbl">P(up)</div>
                      <div className="tnum mt-[3px] text-[16px] font-bold text-green">53.8%</div>
                    </div>
                    <div className="flex-1">
                      <div className="db-lbl">Breakeven</div>
                      <div className="tnum mt-[3px] text-[16px] font-bold">$63,000</div>
                    </div>
                  </div>
                </div>

                <div data-anim="proposalText" className="db-assist">
                  Here&apos;s the bet. Review every line — then sign it in your wallet.
                </div>

                {/* RECEIPT */}
                <div data-anim="receipt" className="db-card-rise relative overflow-hidden rounded-card border border-ink bg-card">
                  <div data-anim="receiptTop" className="h-[3px] bg-ink transition-[background] duration-500" />
                  <div className="flex items-center justify-between border-b border-[#EDE9E0] px-4 py-[13px]">
                    <div>
                      <div data-anim="receiptKicker" className="db-lbl text-ink transition-colors duration-500">
                        Trade confirmation
                      </div>
                      <div data-anim="receiptSub" className="mt-[3px] text-[12.5px] text-muted">
                        Awaiting your signature
                      </div>
                    </div>
                    <span className="mono text-[10.5px] text-faint">DB·7F3A·0112</span>
                  </div>

                  {/* SIGNED stamp */}
                  <div data-anim="stamp" className="db-stamp">
                    <svg viewBox="0 0 24 24" width={22} height={22} style={{ marginBottom: 2 }}>
                      <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="var(--color-green)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="mono text-[7.5px] font-semibold tracking-[0.12em] text-green">SIGNED</span>
                  </div>

                  <div className="px-4 pb-1 pt-4">
                    <div className="mb-[6px] flex items-baseline gap-[10px]">
                      <span className="rounded-[5px] border-[1.3px] border-green px-2 py-[2px] text-[11px] font-bold tracking-[0.06em] text-green">
                        UP ↑
                      </span>
                      <span className="text-[19px] font-bold tracking-[-0.025em]">BTC above $63,000</span>
                    </div>
                    <div className="mb-[14px] text-[12.5px] text-muted">Binary · settles at expiry, in 27 minutes</div>
                    {RECEIPT_ROWS.map(([k, v]) => (
                      <div key={k} className="flex justify-between py-[6px] text-[13.5px]">
                        <span className="text-[#7d7870]">{k}</span>
                        <span className="tnum font-medium">{v}</span>
                      </div>
                    ))}
                    <div className="mt-[5px] flex justify-between border-t border-[#EDE9E0] pb-[6px] pt-[10px] text-[13.5px]">
                      <span className="font-bold">Max payout if right</span>
                      <span className="tnum font-bold text-green">100.00 dUSDC</span>
                    </div>
                  </div>

                  {/* footer: cross-fading layers */}
                  <div className="relative mt-[6px] h-[120px]">
                    <div data-anim="footerProposed" className="absolute inset-0 px-4 pb-4 pt-2 transition-opacity duration-300">
                      <div className="mb-3 flex items-center gap-[9px]">
                        <div className="h-5 w-5 rounded-[5px] bg-wallet" />
                        <span className="text-[12.5px] text-[#7d7870]">
                          Signing with <span className="font-semibold text-ink">Sui Wallet</span>
                        </span>
                        <span className="mono ml-auto text-[11.5px] text-faint">0x7a3f…4e21</span>
                      </div>
                      <div className="flex gap-[11px]">
                        <div data-anim="authBtn" className="flex-1 rounded-[9px] bg-ink p-[13px] text-center text-[14.5px] font-semibold text-paper transition-[box-shadow,transform] duration-300">
                          Authorize &amp; sign
                        </div>
                        <div className="rounded-[9px] border border-line-strong px-[18px] py-[13px] text-center text-[14.5px] font-semibold text-[#7d7870]">
                          Decline
                        </div>
                      </div>
                    </div>
                    <div data-anim="footerSigning" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 pb-4 pt-2 opacity-0 transition-opacity duration-300">
                      <div className="db-spinner" />
                      <span className="text-[13.5px] font-medium text-[#7d7870]">Confirm in your wallet…</span>
                    </div>
                    <div data-anim="footerSigned" className="pointer-events-none absolute inset-0 px-4 pb-[14px] pt-[6px] opacity-0 transition-opacity duration-[400ms]">
                      <div className="rounded-[9px] border border-[#EDE9E0] bg-[#FAFAF7] px-[13px] py-[11px]">
                        <div className="mb-[6px] flex items-center justify-between">
                          <span className="db-lbl">Transaction</span>
                          <span className="border-b-[1.4px] border-green pb-[1px] text-[12px] font-semibold text-green">
                            View on Suiscan ↗
                          </span>
                        </div>
                        <div className="mono break-all text-[11.5px] text-[#43403a]">
                          0x9c2a4f…b71f10b · confirmed in 0.6s
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COMPOSER */}
            <div className="absolute bottom-0 left-0 right-0 z-[5] border-t border-line bg-paper px-4 py-[13px]">
              <div className="flex items-center gap-[10px] rounded-pill border border-line-strong bg-card py-2 pl-4 pr-2">
                <div className="flex min-h-[20px] flex-1 items-center text-[14px]">
                  <span data-anim="placeholder" className="text-[#a8a298] transition-opacity duration-200">
                    Ask about a market, or place a bet…
                  </span>
                  <span data-anim="composerText" className="text-ink" />
                  <span data-anim="caret" className="ml-px h-[17px] w-[1.5px] bg-ink opacity-0" style={{ animation: 'dbCaret 1s step-end infinite' }} />
                </div>
                <div data-anim="sendBtn" className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-ink text-[16px] text-paper transition-transform duration-200">
                  ↑
                </div>
              </div>
            </div>

            {/* WALLET SHEET */}
            <div data-anim="scrim" className="pointer-events-none absolute inset-0 z-[8] bg-[rgba(26,23,20,.32)] opacity-0 transition-opacity duration-300" />
            <div data-anim="walletSheet" className="db-sheet">
              <div className="mx-auto mb-4 h-1 w-9 rounded-[2px] bg-line-strong" />
              <div className="mb-4 flex items-center gap-[10px]">
                <div className="h-[30px] w-[30px] rounded-[8px] bg-wallet" />
                <div>
                  <div className="text-[14px] font-bold">Sui Wallet</div>
                  <div className="mono text-[11px] text-faint">testnet · 0x7a3f…4e21</div>
                </div>
                <span className="mono ml-auto rounded-[4px] border border-line-strong px-[7px] py-1 text-[10px] tracking-[0.06em] text-muted">
                  SIGN REQUEST
                </span>
              </div>
              <div className="mb-4 rounded-[12px] border border-[#EDE9E0] bg-card px-[15px] py-[14px]">
                <div className="mb-2 text-[13px] text-[#7d7870]">DeepBookie requests your signature for</div>
                <div className="mb-3 text-[15px] font-bold">Mint 100 UP · BTC above $63,000</div>
                <div className="flex justify-between py-1 text-[13px]">
                  <span className="text-[#7d7870]">Pay</span>
                  <span className="tnum font-semibold">54.07 dUSDC</span>
                </div>
                <div className="flex justify-between py-1 text-[13px]">
                  <span className="text-[#7d7870]">Gas (est.)</span>
                  <span className="tnum font-semibold">0.0021 SUI</span>
                </div>
              </div>
              <div className="flex gap-[11px]">
                <div className="flex-1 rounded-[11px] bg-wallet p-[14px] text-center text-[15px] font-bold text-white">
                  Approve
                </div>
                <div className="rounded-[11px] border border-line-strong px-5 py-[14px] text-center text-[15px] font-semibold text-[#7d7870]">
                  Reject
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mono text-[10.5px] tracking-[0.05em] text-faint">
        a real turn — ask · read the odds · sign it yourself
      </div>
    </div>
  );
}
