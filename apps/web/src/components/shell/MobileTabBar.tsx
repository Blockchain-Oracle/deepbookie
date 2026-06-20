'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/chat', label: 'Chat' },
  { href: '/markets', label: 'Markets' },
  { href: '/positions', label: 'Positions' },
  { href: '/vault', label: 'Vault' },
  { href: '/history', label: 'History' },
];

export function MobileTabBar() {
  const path = usePathname();
  return (
    <nav className="flex shrink-0 border-t border-line bg-paper px-2 pb-3 pt-2.5 md:hidden">
      {TABS.map((t) => {
        const on = path === t.href || path.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 truncate px-0.5 text-center text-[10.5px] ${on ? 'font-semibold text-ink' : 'text-[#a8a298]'}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
