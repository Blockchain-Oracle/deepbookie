'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NAV } from '@/lib/nav';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <aside
      className="dbk-sidebar"
      style={{
        width: 264,
        flex: 'none',
        position: 'sticky',
        top: 60,
        alignSelf: 'flex-start',
        height: 'calc(100vh - 60px)',
        overflowY: 'auto',
        padding: '26px 14px 40px 24px',
        borderRight: '1px solid #DED9CF',
      }}
    >
      {NAV.map((grp) => {
        const open = !collapsed[grp.id];
        return (
          <div key={grp.id} style={{ marginBottom: 18 }}>
            <button
              onClick={() =>
                setCollapsed((c) => ({ ...c, [grp.id]: !c[grp.id] }))
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                marginBottom: 4,
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#928d83',
                  fontWeight: 600,
                }}
              >
                {grp.label}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: '#b0aa9f',
                  transition: 'transform .2s',
                  transform: open ? 'none' : 'rotate(-90deg)',
                }}
              >
                ▼
              </span>
            </button>
            {open && (
              <div>
                {grp.items.map((it) => {
                  const active = pathname === it.href;
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      style={{
                        display: 'block',
                        textDecoration: 'none',
                        fontSize: 14,
                        padding: '6px 10px',
                        margin: '1px 0',
                        borderRadius: 7,
                        color: active ? '#2C5E4A' : '#615c53',
                        background: active ? '#F4F7F4' : 'transparent',
                        fontWeight: active ? 600 : 400,
                        borderLeft: `2px solid ${active ? '#2C5E4A' : 'transparent'}`,
                      }}
                    >
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div
        style={{
          marginTop: 26,
          paddingTop: 18,
          borderTop: '1px solid #E6E1D8',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: '#2C5E4A',
            background: '#F4F7F4',
            border: '1px solid #DCEAE2',
            borderRadius: 99,
            padding: '4px 9px',
          }}
        >
          testnet · v0.1
        </span>
        <a
          href="/llms.txt"
          className="mono"
          style={{ fontSize: 11, color: '#8a857b', textDecoration: 'none' }}
        >
          llms.txt
        </a>
      </div>
    </aside>
  );
}
