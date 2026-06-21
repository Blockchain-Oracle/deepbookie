# Handover — Documentation site (`apps/docs`)

**Branch:** `feat/docs-site` (pushed to `origin` → [github.com/Blockchain-Oracle/deepbookie](https://github.com/Blockchain-Oracle/deepbookie/tree/feat/docs-site))
**Status:** Complete and CI-green (typecheck + lint + production build all pass). Not yet deployed.
**Target:** `docs.deepbookie.xyz` (its own Vercel project — see Deploy below).

---

## What this is

A standalone documentation site at **`apps/docs`** (package `@deepbookie/docs`),
built with **Nextra v4** (Next.js App Router) and a **fully custom theme** ported
1:1 from the designer's `Design system exploration (7)/DeepBookie Docs.dc.html`.
Warm-paper brand, no dark mode, Schibsted Grotesk + IBM Plex Mono.

It documents the whole product: home, custom 404, Get Started, Concepts (with the
architecture + SVI→N(d₂) diagrams), the four Surfaces (Web / MCP / CLI / Skill),
the **real 44-tool catalog**, the SDK packages, Reference, and Cookbooks.

**Content was audited against the actual code** (`research/docs-audit.md`), not the
README. Key facts it gets right: **44 tools** (not 27/35); DeepBookie trades **two
markets** (Predict binary options + Spot order book); dUSDC is **operator-gated**
("Get dUSDC" / tally form), not a public faucet; the skill installs via **Vercel
Skills** (`npx skills add`), a skill is a `SKILL.md` folder (not an npm package).

Features: Pagefind search (⌘K), an `/llms.txt` route, and live `<PromptDemo>`
widgets (the odds curve + the 6-state sign receipt) on *How a trade works*.

## Run it locally

```bash
pnpm install
pnpm --filter @deepbookie/docs dev      # http://localhost:3000 (or -p 3011)
pnpm --filter @deepbookie/docs build     # production build + Pagefind index
```

> **Important:** the scripts use `--webpack`. Nextra v4 + Next 16's Turbopack
> can't resolve `next-mdx-import-source-file`, so **do not remove `--webpack`**.

## Layout (what to know before editing)

- **Content** = MDX in `apps/docs/content/**`, served by the catch-all
  `app/[...mdxPath]/page.tsx` (via Nextra `importPage`). Add a page = drop a new
  `.mdx` file. Do **not** put `page.mdx` directly under `app/` — it breaks the
  `metadata` export.
- **Sidebar** = hardcoded in `lib/nav.ts` (not auto-generated). Add a page there.
- **Bespoke `.tsx` pages**: `app/page.tsx` (home), `app/not-found.tsx` (404),
  `app/tools/page.tsx` (the 44-tool catalog, data in `lib/tools-data.ts`),
  `app/llms.txt/route.ts`.
- **Chrome**: `components/shell/*` (Navbar, Sidebar, DocsShell, SearchModal,
  MobileDrawer, Footer). **Content widgets**: `components/content/*` (Callout,
  Steps, Toc, ArchDiagram, OddsCurve, PromptDemo, SignReceiptStates) — all
  registered in `mdx-components.tsx`.
- **Brand tokens**: `app/global.css` (`@theme`), copied from `apps/web`.

## Deploy (owner / DevOps — separate Vercel project)

1. New Vercel project from this repo, **Root Directory = `apps/docs`**.
2. Keep "Include files outside the Root Directory" ON (so `packages/*` resolve).
   Vercel auto-detects Next.js + pnpm (`pnpm@10.33.0`).
3. Build command: default `pnpm build` (runs `next build --webpack` + the Pagefind
   `postbuild`). Pagefind self-downloads its binary on first run.
4. Add domain **`docs.deepbookie.xyz`** → CNAME `docs` → `cname.vercel-dns.com`
   (DNS-only on Cloudflare so Vercel can issue TLS).
5. Optional: set an Ignored Build Step so doc-only pushes don't rebuild `apps/web`.

## Merging

This branch is **additive** — it only adds `apps/docs/**` plus three small,
non-conflicting edits:
- `eslint.config.js` — adds `.source`/`_pagefind` ignores + an `apps/docs` React override.
- `.claude/launch.json` — adds a `docs` dev-server entry.
- `pnpm-lock.yaml` — adds the Nextra/Pagefind deps for `apps/docs`.

It deliberately does **not** touch `apps/web/**` or `packages/**`, so it should
merge cleanly. If `pnpm-lock.yaml` conflicts with another branch, re-run
`pnpm install` after merging to regenerate it.

## Known follow-ups (not blockers)

- **Skill package name (repo cleanup):** `skills/deepbookie/package.json` is named
  `@deepbookie/skill`, which wrongly implies an npm package. The skill is a folder;
  rename/remove that `name` so it matches reality (the docs already say so).
- The architecture diagram scrolls horizontally on narrow widths (cosmetic).
- Only two `<PromptDemo>` widgets are wired (odds curve + sign receipt). The
  Quote/Range/Vault/Portfolio widgets from the design can be added later.
- `research/docs-audit.md` is the living source of truth for content accuracy —
  re-run that kind of audit if the tool registry or surfaces change.
