/** The docs sidebar tree — mirrors the designer's nav, mapped to real routes. */
export type NavItem = { label: string; href: string };
export type NavGroup = { id: string; label: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    id: 'get',
    label: 'Get Started',
    items: [
      { label: 'Introduction', href: '/get-started/introduction' },
      { label: 'How a trade works', href: '/get-started/how-it-works' },
      { label: 'Quickstart: Web app', href: '/get-started/quickstart-web' },
      { label: 'Quickstart: MCP', href: '/get-started/quickstart-mcp' },
    ],
  },
  {
    id: 'con',
    label: 'Concepts',
    items: [
      { label: 'Architecture', href: '/concepts/architecture' },
      { label: 'The sign-at-the-edge model', href: '/concepts/sign-at-edge' },
      { label: 'Pricing: SVI → N(d2)', href: '/concepts/pricing' },
      { label: 'Scaling & units', href: '/concepts/scaling' },
    ],
  },
  {
    id: 'surf',
    label: 'Surfaces',
    items: [
      { label: 'Web app', href: '/surfaces/web' },
      { label: 'MCP server', href: '/surfaces/mcp' },
      { label: 'CLI', href: '/surfaces/cli' },
      { label: 'Claude skill', href: '/surfaces/skill' },
    ],
  },
  {
    id: 'tr',
    label: 'Tool Reference',
    items: [
      { label: 'All 44 tools', href: '/tools' },
      { label: 'Predict tools', href: '/tools?surface=predict' },
      { label: 'Spot tools', href: '/tools?surface=spot' },
    ],
  },
  {
    id: 'sdk',
    label: 'SDK / API',
    items: [
      { label: '@deepbookie/predict-client', href: '/sdk/predict-client' },
      { label: '@deepbookie/core', href: '/sdk/core' },
    ],
  },
  {
    id: 'ref',
    label: 'Reference',
    items: [
      { label: 'Testnet facts & addresses', href: '/reference/testnet' },
      { label: 'Error codes', href: '/reference/errors' },
      { label: 'Glossary', href: '/reference/glossary' },
    ],
  },
];

/** Flattened nav for prev/next + breadcrumb lookup. */
export type FlatItem = NavItem & { group: string };
export const FLAT_NAV: FlatItem[] = NAV.flatMap((g) =>
  g.items.map((it) => ({ ...it, group: g.label })),
);

export function navLookup(pathname: string): {
  group?: string;
  label?: string;
  prev?: NavItem;
  next?: NavItem;
} {
  const i = FLAT_NAV.findIndex((it) => it.href === pathname);
  if (i === -1) return {};
  return {
    group: FLAT_NAV[i].group,
    label: FLAT_NAV[i].label,
    prev: i > 0 ? FLAT_NAV[i - 1] : undefined,
    next: i < FLAT_NAV.length - 1 ? FLAT_NAV[i + 1] : undefined,
  };
}

export const NAV_TABS: NavItem[] = [
  { label: 'Docs', href: '/get-started/introduction' },
  { label: 'Tools', href: '/tools' },
  { label: 'Cookbooks', href: '/cookbooks' },
];

export const APP_URL = 'https://deepbookie.xyz';
export const GITHUB_URL = 'https://github.com/Blockchain-Oracle/deepbookie';
