/**
 * The scripted animation engine for the hero DemoPhone. Pure DOM imperative
 * logic — no React — so the view component stays a thin presentational shell.
 * Ported 1:1 from the designer's timeline (Demo.dc.html). All values static.
 */

const INK = 'var(--color-ink)';
const GREEN = 'var(--color-green)';
const SIGNED_OPACITY = '0.92';

const RISE = ['msgUser', 'assistText', 'curveCard', 'proposalText', 'receipt', 'marker'] as const;

type Timers = ReturnType<typeof setTimeout>[];

/** Runs the looping demo. Returns a cleanup fn for useEffect teardown. */
export function runDemo(root: HTMLElement): () => void {
  const timers: Timers = [];
  let typeInt: ReturnType<typeof setInterval> | undefined;
  const $ = (n: string) => root.querySelector<HTMLElement>(`[data-anim="${n}"]`);
  const add = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-anim]'));
  const saved = new Map(els.map((e) => [e, e.style.transition]));
  const set = (n: string, prop: string, val: string) => {
    const e = $(n);
    if (e) (e.style as unknown as Record<string, string>)[prop] = val;
  };

  const path = $('curvePath') as unknown as SVGPathElement | null;
  const pathLen = path?.getTotalLength?.() ?? 0;
  if (path) {
    path.style.strokeDasharray = String(pathLen);
    path.style.strokeDashoffset = String(pathLen);
  }

  const reveal = (n: string) => set2($, n, '1', 'translateY(0)');
  const conceal = (n: string) => set2($, n, '0', 'translateY(14px)');

  const frame = (name: string, z = 1, anchor = 0.5) => {
    const scroll = $('scroll');
    const cam = $('camera');
    const el = $(name);
    if (!scroll || !cam || !el) return;
    const cx = el.offsetLeft + el.offsetWidth / 2;
    const cy = el.offsetTop + el.offsetHeight / 2;
    let tx = scroll.clientWidth / 2 - z * cx;
    const ty = scroll.clientHeight * anchor - z * cy;
    if (z <= 1.001) tx = 0;
    cam.style.transform = `translate(${tx}px,${ty}px) scale(${z})`;
  };

  const reset = () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    if (typeInt) clearInterval(typeInt);
    els.forEach((e) => (e.style.transition = 'none'));
    RISE.forEach(conceal);
    set('dots', 'height', '0');
    set('dots', 'opacity', '0');
    if (path) {
      path.style.transition = 'none';
      path.style.strokeDashoffset = String(pathLen);
    }
    set('curveArea', 'opacity', '0');
    set('ring', 'animation', '');
    set('camera', 'transform', 'translate(0,0) scale(1)');
    const ct = $('composerText');
    if (ct) ct.textContent = '';
    set('placeholder', 'opacity', '1');
    set('caret', 'opacity', '0');
    set('receiptTop', 'background', INK);
    set('receiptKicker', 'color', INK);
    const rs = $('receiptSub');
    if (rs) rs.textContent = 'Awaiting your signature';
    set('stamp', 'opacity', '0');
    set('stamp', 'transform', 'scale(1.7) rotate(-20deg)');
    set('footerProposed', 'opacity', '1');
    set('footerSigning', 'opacity', '0');
    set('footerSigned', 'opacity', '0');
    set('walletSheet', 'transform', 'translateY(115%)');
    set('scrim', 'opacity', '0');
    set('authBtn', 'boxShadow', 'none');
    set('authBtn', 'transform', 'none');
    set('scroll', 'opacity', '1');
    void root.offsetHeight;
    els.forEach((e) => (e.style.transition = saved.get(e) ?? ''));
  };

  const typeQuestion = () => {
    const elc = $('composerText');
    set('placeholder', 'opacity', '0');
    set('caret', 'opacity', '1');
    const text = 'Will BTC be above $63k in the next half hour?';
    let i = 0;
    typeInt = setInterval(() => {
      i++;
      if (elc) elc.textContent = text.slice(0, i);
      if (i >= text.length && typeInt) clearInterval(typeInt);
    }, 34);
  };

  const sequence = () => {
    add(400, typeQuestion);
    add(2300, () => {
      const elc = $('composerText');
      if (elc) elc.textContent = '';
      set('caret', 'opacity', '0');
      set('placeholder', 'opacity', '1');
      const s = $('sendBtn');
      if (s) {
        s.style.transform = 'scale(.82)';
        setTimeout(() => (s.style.transform = 'scale(1)'), 180);
      }
      reveal('msgUser');
      frame('msgUser', 1, 0.72);
    });
    add(2900, () => {
      set('dots', 'height', '34px');
      set('dots', 'opacity', '1');
      frame('dots', 1, 0.72);
    });
    add(3900, () => {
      set('dots', 'height', '0');
      set('dots', 'opacity', '0');
      reveal('assistText');
      frame('assistText', 1, 0.7);
    });
    add(4700, () => {
      reveal('curveCard');
      frame('curveCard', 1, 0.58);
    });
    add(5100, () => {
      if (path) {
        path.style.transition = 'stroke-dashoffset 1.05s cubic-bezier(.4,0,.2,1)';
        path.style.strokeDashoffset = '0';
      }
      set('curveArea', 'opacity', '1');
    });
    add(5900, () => reveal('marker'));
    add(6300, () => {
      frame('chart', 1.55, 0.46);
      set('ring', 'animation', 'dbRing 1.6s ease-out infinite');
    });
    add(8000, () => {
      set('ring', 'animation', '');
      frame('curveCard', 1, 0.55);
    });
    add(8500, () => {
      reveal('proposalText');
      frame('proposalText', 1, 0.7);
    });
    add(9100, () => {
      reveal('receipt');
      frame('receipt', 1, 0.6);
    });
    add(9900, () => frame('receipt', 1.28, 0.46));
    add(10900, () => {
      const b = $('authBtn');
      if (b) {
        b.style.boxShadow = '0 0 0 4px rgba(26,23,20,.16)';
        b.style.transform = 'scale(1.02)';
        setTimeout(() => {
          b.style.boxShadow = 'none';
          b.style.transform = 'none';
        }, 260);
      }
    });
    add(11500, () => {
      set('scrim', 'opacity', '1');
      set('walletSheet', 'transform', 'translateY(0)');
      set('footerProposed', 'opacity', '0');
      set('footerSigning', 'opacity', '1');
      const rs = $('receiptSub');
      if (rs) rs.textContent = 'Signing…';
    });
    add(13100, () => {
      set('walletSheet', 'transform', 'translateY(115%)');
      set('scrim', 'opacity', '0');
    });
    add(13600, () => {
      set('footerSigning', 'opacity', '0');
      set('receiptTop', 'background', GREEN);
      set('receiptKicker', 'color', GREEN);
      const rs = $('receiptSub');
      if (rs) rs.textContent = 'Signed · just now';
      set('stamp', 'opacity', SIGNED_OPACITY);
      set('stamp', 'transform', 'scale(1) rotate(-9deg)');
      frame('receipt', 1.12, 0.46);
    });
    add(14200, () => set('footerSigned', 'opacity', '1'));
    add(14900, () => frame('receipt', 1, 0.52));
    add(18000, loop);
  };

  const loop = () => {
    set('scroll', 'transition', 'opacity .4s ease');
    set('scroll', 'opacity', '0');
    add(450, () => {
      reset();
      set('scroll', 'transition', 'opacity .45s ease');
      set('scroll', 'opacity', '1');
      add(280, sequence);
    });
  };

  timers.push(setTimeout(loop, 500));
  return () => {
    timers.forEach(clearTimeout);
    if (typeInt) clearInterval(typeInt);
  };
}

/** Resting frame for prefers-reduced-motion: the signed, settled receipt. */
export function restingFrame(root: HTMLElement) {
  const $ = (n: string) => root.querySelector<HTMLElement>(`[data-anim="${n}"]`);
  const set = (n: string, prop: string, val: string) => {
    const e = $(n);
    if (e) (e.style as unknown as Record<string, string>)[prop] = val;
  };
  RISE.forEach((n) => set2($, n, '1', 'none'));
  const path = $('curvePath') as unknown as SVGPathElement | null;
  if (path) path.style.strokeDashoffset = '0';
  set('curveArea', 'opacity', '1');
  set('receiptTop', 'background', GREEN);
  set('receiptKicker', 'color', GREEN);
  const rs = $('receiptSub');
  if (rs) rs.textContent = 'Signed · just now';
  set('stamp', 'opacity', SIGNED_OPACITY);
  set('stamp', 'transform', 'scale(1) rotate(-9deg)');
  set('footerProposed', 'opacity', '0');
  set('footerSigned', 'opacity', '1');
  set('placeholder', 'opacity', '1');
}

function set2(
  $: (n: string) => HTMLElement | null,
  n: string,
  opacity: string,
  transform: string,
) {
  const e = $(n);
  if (e) {
    e.style.opacity = opacity;
    e.style.transform = transform;
  }
}
