/**
 * Real asset brand marks (BTC / ETH / SUI) as inline SVG — crisp at any size, themeable, no asset
 * pipeline. Unknown assets fall back to the first letter on an ink disc.
 */
export function CoinLogo({ asset, size = 30 }: { asset: string; size?: number }) {
  const key = asset.toUpperCase();
  const common = { width: size, height: size, viewBox: '0 0 32 32', 'aria-label': key, role: 'img' as const };

  if (key === 'BTC') {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path
          fill="#fff"
          d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"
        />
      </svg>
    );
  }

  if (key === 'ETH') {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <g fill="#fff">
          <path fillOpacity=".6" d="M16.498 4v8.87l7.497 3.35z" />
          <path d="M16.498 4L9 16.22l7.498-3.35z" />
          <path fillOpacity=".6" d="M16.498 21.968v6.027L24 17.616z" />
          <path d="M16.498 27.995v-6.028L9 17.616z" />
          <path fillOpacity=".2" d="M16.498 20.573l7.497-4.353-7.497-3.348z" />
          <path fillOpacity=".6" d="M9 16.22l7.498 4.353v-7.701z" />
        </g>
      </svg>
    );
  }

  if (key === 'SUI') {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="16" fill="#4DA2FF" />
        <path fill="#fff" d="M16 7c-4 6-6 9-6 12a6 6 0 0 0 12 0c0-3-2-6-6-12zm0 4.6c2.4 3.7 3.6 5.6 3.6 7.4a3.6 3.6 0 1 1-7.2 0c0-1.8 1.2-3.7 3.6-7.4z" />
      </svg>
    );
  }

  // DeepBook testnet coins (+ DBTC = testnet BTC) — branded disc + glyph so EVERY asset shows its own
  // mark, never a hardcoded BTC. (Predict markets are BTC today but may add ETH/SUI; spot has these.)
  if (key === 'DBTC') {
    return (
      <span className="flex items-center justify-center rounded-full font-bold text-paper" style={{ width: size, height: size, fontSize: size * 0.48, background: '#F7931A' }}>
        ₿
      </span>
    );
  }
  if (DISC[key]) {
    const d = DISC[key];
    return (
      <span className="flex items-center justify-center rounded-full font-bold text-paper" style={{ width: size, height: size, fontSize: size * 0.44, background: d.bg }}>
        {d.glyph}
      </span>
    );
  }

  return (
    <span
      className="flex items-center justify-center rounded-full bg-ink font-bold text-paper"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {key.charAt(0)}
    </span>
  );
}

/** Disc tint + glyph per DeepBook coin — one source of truth for coin marks (used app-wide). */
const DISC: Record<string, { bg: string; glyph: string }> = {
  DEEP: { bg: '#2C5E4A', glyph: '◈' },
  DBUSDC: { bg: '#2775CA', glyph: '$' },
  DBUSDT: { bg: '#26A17B', glyph: '$' },
  WAL: { bg: '#7d6f3a', glyph: 'W' },
};
