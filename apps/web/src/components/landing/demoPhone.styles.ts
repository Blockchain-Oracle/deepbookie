/** Scoped keyframes + structural CSS for the hero DemoPhone. The phone renders
 *  at its native 384x732 (the camera math depends on fixed pixel offsets) and is
 *  visually scaled to ~300px to fit the hero; the wrapper reserves the scaled box
 *  (.78 * 384 = 300, .78 * 732 = 571) so layout doesn't reflow. */
export const DEMO_PHONE_CSS = `
@keyframes dbCaret{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes dbDot{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}
@keyframes dbRing{0%{transform:scale(1);opacity:.5}70%{transform:scale(2.4);opacity:0}100%{opacity:0}}
@keyframes dbSpin{to{transform:rotate(360deg)}}
@keyframes dbLive{0%,100%{opacity:1}50%{opacity:.25}}
.db-scaler{width:300px;height:571px;max-width:88vw}
.db-phone{width:384px;height:732px;transform:scale(.78);transform-origin:top left}
.db-frame{position:relative;width:384px;height:732px;background:var(--color-paper);border-radius:44px;box-shadow:0 40px 90px -34px rgba(26,23,20,.5),0 0 0 1px rgba(26,23,20,.06);border:1px solid var(--color-line-strong);overflow:hidden}
.db-scroll{position:absolute;top:90px;bottom:74px;left:0;right:0;overflow:hidden}
.db-camera{position:absolute;top:0;left:0;width:100%;padding:18px 18px 24px;display:flex;flex-direction:column;gap:16px;transform-origin:0 0;transition:transform 1.15s cubic-bezier(.5,.05,.2,1);will-change:transform}
.db-msg-user{align-self:flex-end;max-width:82%;background:var(--color-ink);color:var(--color-paper);padding:11px 15px;border-radius:17px 17px 5px 17px;font-size:14px;line-height:1.4;opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .55s cubic-bezier(.22,.61,.36,1)}
.db-dots{align-self:flex-start;display:flex;align-items:center;gap:5px;background:var(--color-card);border:1px solid var(--color-line);border-radius:14px;padding:0 16px;height:0;opacity:0;overflow:hidden;transition:height .35s ease,opacity .3s ease}
.db-dots span{width:6px;height:6px;border-radius:50%;background:#a8a298}
.db-assist{align-self:flex-start;max-width:92%;font-size:14px;line-height:1.55;color:var(--color-ink-soft);opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .55s cubic-bezier(.22,.61,.36,1)}
.db-card-rise{opacity:0;transform:translateY(16px);transition:opacity .5s ease,transform .55s cubic-bezier(.22,.61,.36,1)}
.db-lbl{font-size:10px;letter-spacing:0.13em;text-transform:uppercase;color:var(--color-faint);font-weight:600}
.db-stamp{position:absolute;top:64px;right:16px;width:72px;height:72px;border:1.5px solid var(--color-green);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transform:scale(1.7) rotate(-20deg);transition:opacity .25s ease,transform .5s cubic-bezier(.34,1.56,.64,1);z-index:3}
.db-spinner{width:26px;height:26px;border:2.5px solid var(--color-line-strong);border-top-color:var(--color-ink);border-radius:50%;animation:dbSpin .8s linear infinite}
.db-sheet{position:absolute;left:0;right:0;bottom:0;z-index:9;background:#FBFAF7;border-radius:22px 22px 0 0;box-shadow:0 -16px 40px -16px rgba(26,23,20,.4);transform:translateY(115%);transition:transform .5s cubic-bezier(.5,.05,.2,1);padding:18px 20px 24px}
@media (prefers-reduced-motion: reduce){
  .db-camera,.db-msg-user,.db-assist,.db-card-rise,.db-dots,.db-stamp{transition:none!important}
  .db-spinner{animation:none!important}
}
`;
