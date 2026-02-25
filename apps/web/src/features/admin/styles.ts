import type { CSSProperties } from 'react';

export const s = {
  pageTitle: { fontSize: 22, fontWeight: 800, color: 'var(--adm-t1)', letterSpacing: '-0.02em' } as CSSProperties,

  card: {
    background: 'var(--adm-card)', borderRadius: 16,
    boxShadow: 'var(--adm-shadow)', border: '1px solid var(--adm-border)',
  } as CSSProperties,

  tblWrap: {
    background: 'var(--adm-card)', borderRadius: 16, overflow: 'auto',
    boxShadow: 'var(--adm-shadow)', border: '1px solid var(--adm-border)',
  } as CSSProperties,

  th: {
    padding: '12px 16px', textAlign: 'left' as const, fontWeight: 600,
    fontSize: 11, color: 'var(--adm-t3)', textTransform: 'uppercase' as const,
    letterSpacing: '0.07em', borderBottom: '1px solid var(--adm-border)',
    background: 'var(--adm-th)', whiteSpace: 'nowrap' as const,
  } as CSSProperties,

  td: { padding: '13px 16px', color: 'var(--adm-t2)', fontSize: 13, verticalAlign: 'middle' as const } as CSSProperties,

  inp: {
    width: '100%', padding: '10px 14px',
    border: '1px solid var(--adm-border2)', borderRadius: 10,
    fontSize: 13, outline: 'none', background: 'var(--adm-inp)', color: 'var(--adm-t1)',
    boxSizing: 'border-box' as const, transition: 'all 0.15s',
  } as CSSProperties,

  sel: {
    padding: '10px 14px', border: '1px solid var(--adm-border2)', borderRadius: 10,
    fontSize: 13, outline: 'none', background: 'var(--adm-inp)',
    color: 'var(--adm-t1)', cursor: 'pointer',
  } as CSSProperties,

  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 7, borderRadius: 8, display: 'flex', alignItems: 'center',
    color: 'var(--adm-t4)', transition: 'all 0.15s',
  } as CSSProperties,

  pageBtn: {
    width: 34, height: 34, border: '1px solid var(--adm-border2)',
    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    transition: 'all 0.15s', background: 'var(--adm-card)', color: 'var(--adm-t3)',
  } as CSSProperties,

  errBox: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
    padding: '12px 16px', color: '#dc2626', marginBottom: 16,
    fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
  } as CSSProperties,

  empty: {
    textAlign: 'center' as const, padding: '48px 20px', color: 'var(--adm-t4)', fontSize: 14,
  } as CSSProperties,

  filterBtn: (active: boolean): CSSProperties => ({
    padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
    fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
    border: `1px solid ${active ? '#6366f1' : 'var(--adm-border2)'}`,
    background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--adm-card)',
    color: active ? '#fff' : 'var(--adm-t3)',
    boxShadow: active ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
  }),
};
