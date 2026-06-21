# @deepbookie/docs

The DeepBookie documentation site — [docs.deepbookie.xyz](https://docs.deepbookie.xyz).
Built with [Fumadocs](https://fumadocs.dev) (Next.js App Router) on a single
fixed light brand. Content is MDX under `content/docs`.

## Develop

```bash
pnpm install                     # from the monorepo root
pnpm --filter @deepbookie/docs dev
```

Open http://localhost:3000. The `fumadocs-mdx` step (run via `postinstall` and
`build`) generates `.source` from the MDX content.

## Build

```bash
pnpm --filter @deepbookie/docs build   # fumadocs-mdx && next build
```

## Deploy (Vercel — separate project)

This is its **own** Vercel project, independent of the web app's pipeline:

1. New Vercel project from this repo → **Root Directory = `apps/docs`**.
2. Keep **"Include files outside the Root Directory"** ON (default) so
   `packages/*` and `apps/web/src` resolve. Vercel auto-detects Next.js + pnpm
   and installs from the workspace root (`pnpm@10.33.0` via the root
   `packageManager` field).
3. Settings → Domains → add **`docs.deepbookie.xyz`**. At the DNS provider add a
   `CNAME docs → cname.vercel-dns.com` (grey-cloud / DNS-only on Cloudflare so
   Vercel can issue TLS).
4. Optional: set an **Ignored Build Step** so doc-only pushes don't rebuild the
   web app and vice-versa.

## Conventions

- **No dark mode** — single brand theme (`RootProvider theme={{ enabled:false }}`).
- Brand tokens live in `app/global.css` (copied from `apps/web`, mapped onto
  Fumadocs `--color-fd-*`).
- Files stay ≤300 lines (repo `max-lines` CI gate).
