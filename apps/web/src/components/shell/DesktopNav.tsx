'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/chat', label: 'Chat' },
  { href: '/markets', label: 'Markets' },
  { href: '/positions', label: 'Positions' },
  { href: '/vault', label: 'Vault' },
  { href: '/history', label: 'History' },
  { href: '/docs', label: 'Docs' },
];

export function DesktopNav() {
  const path = usePathname();
  return (
    <nav className="hidden w-52 shrink-0 flex-col gap-1 border-r border-line-strong bg-[#F0EDE5] p-3.5 md:flex">
      {ITEMS.map((it) => {
        const on = path === it.href || path.startsWith(`${it.href}/`);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center gap-2.5 rounded-card-in px-3.5 py-2.5 text-sm transition ${
              on ? 'border border-line-strong bg-card font-semibold text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            <span className={`size-[7px] rounded-[2px] ${on ? 'bg-green' : 'bg-[#c2bcb0]'}`} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
