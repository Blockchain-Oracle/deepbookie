import type { ReactNode } from 'react';
import { Mark } from '../brand/Mark';

/**
 * Pairs the natural-language prompt a user types with the widget the agent
 * renders back. The "Run live" toggle is reserved for a future live mode.
 */
export function PromptDemo({
  prompt,
  tool,
  label,
  children,
}: {
  prompt: string;
  tool?: string;
  label?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E6E1D8',
        borderRadius: 14,
        overflow: 'hidden',
        margin: '18px 0',
        boxShadow: '0 18px 40px -28px rgba(26,23,20,.3)',
      }}
    >
      {/* header + toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 14px',
          borderBottom: '1px solid #EDE9E0',
          background: '#FAFAF7',
        }}
      >
        <span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#928d83', fontWeight: 600 }}>
          {label ?? 'Live widget'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', background: '#EFEBE2', borderRadius: 99, padding: 3 }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: '#1A1714', background: '#fff', borderRadius: 99, padding: '5px 12px', boxShadow: '0 1px 2px rgba(26,23,20,.12)' }}>Example</span>
            <span className="mono" title="Coming soon" style={{ fontSize: 11, fontWeight: 500, color: '#b0aa9f', padding: '5px 12px', cursor: 'not-allowed' }}>Run live</span>
          </div>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.06em', color: '#9c7a2a', background: '#FBF6EC', border: '1px solid #ECDCBC', borderRadius: 99, padding: '3px 8px' }}>soon</span>
        </div>
      </div>

      {/* prompt row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 16px' }}>
        <Mark size={22} />
        <span style={{ flex: 1, fontSize: 15, color: '#1A1714' }}>{prompt}</span>
        {tool && (
          <span className="mono" style={{ fontSize: 11, color: '#2C5E4A', background: '#F4F7F4', border: '1px solid #DCEAE2', borderRadius: 6, padding: '4px 9px', flex: 'none' }}>
            {tool}
          </span>
        )}
      </div>

      {/* divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}>
        <div style={{ flex: 1, height: 1, background: '#EDE9E0' }} />
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b0aa9f' }}>renders ↓</span>
        <div style={{ flex: 1, height: 1, background: '#EDE9E0' }} />
      </div>

      {/* the widget */}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
