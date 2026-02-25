import type { CSSProperties } from 'react';

export const s = {
  pageTitle: { fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' } satisfies CSSProperties,

  card: {
    background: '#fff', borderRadius: 16,
    boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9',
  } satisfies CSSProperties,

  tblWrap: {
    background: '#fff', borderRadius: 16, overflow: 'auto',
    boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9',
  } satisfies CSSProperties,

  th: {
    padding: '12px 16px', textAlign: 'left' as const, fontWeight: 600,
    fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' as const,
    letterSpacing: '0.07em', borderBottom: '1px solid #f1f5f9',
    background: '#fafafa', whiteSpace: 'nowrap' as const,
  } satisfies CSSProperties,

  td: { padding: '13px 16px', color: '#374151', fontSize: 13, verticalAlign: 'middle' as const } satisfies CSSProperties,

  inp: {
    width: '100%', padding: '10px 14px',
    border: '1px solid #e2e8f0', borderRadius: 10,
    fontSize: 13, outline: 'none', background: '#fff', color: '#0f172a',
    boxSizing: 'border-box' as const, transition: 'all 0.15s',
  } satisfies CSSProperties,

  sel: {
    padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10,
    fontSize: 13, outline: 'none', background: '#fff',
    color: '#0f172a', cursor: 'pointer',
  } satisfies CSSProperties,

  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 7, borderRadius: 8, display: 'flex', alignItems: 'center',
    color: '#94a3b8', transition: 'all 0.15s',
  } satisfies CSSProperties,

  pageBtn: {
    width: 34, height: 34, border: '1px solid #e2e8f0',
    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    transition: 'all 0.15s',
  } satisfies CSSProperties,

  errBox: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
    padding: '12px 16px', color: '#dc2626', marginBottom: 16,
    fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
  } satisfies CSSProperties,

  empty: {
    textAlign: 'center' as const, padding: '48px 20px', color: '#94a3b8', fontSize: 14,
  } satisfies CSSProperties,

  filterBtn: (active: boolean): CSSProperties => ({
    padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
    fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
    border: `1px solid ${active ? '#6366f1' : '#e2e8f0'}`,
    background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#fff',
    color: active ? '#fff' : '#64748b',
    boxShadow: active ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
  }),
};
