'use client';
import { useEffect, useState, useCallback } from 'react';
import { Trash2, Search, RefreshCw, Store } from 'lucide-react';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { adminApi } from '../../../src/lib/adminApi';
import { s } from '../../../src/features/admin/styles';

interface StoreItem { id: string; name: string; phone: string; address: string; is_active: boolean; created_at: string; owner_name: string; owner_email: string; product_count: number; }
interface Pagination { page: number; limit: number; total: number; pages: number; }

export default function StoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) p.set('search', search);
      const res = await adminApi.get<{ stores: StoreItem[]; pagination: Pagination }>(`/api/admin/stores?${p}`);
      setStores(res.stores); setPagination(res.pagination);
    } catch (e) { setError(e instanceof Error ? e.message : 'Xatolik'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function del(id: string, name: string) {
    if (!confirm(`"${name}" do'konini o'chirasizmi?`)) return;
    setDeletingId(id);
    try { await adminApi.delete(`/api/admin/stores/${id}`); setStores(p => p.filter(st => st.id !== id)); }
    catch (e) { alert(e instanceof Error ? e.message : 'Xatolik'); }
    finally { setDeletingId(null); }
  }

  async function toggleActive(st: StoreItem) {
    try {
      await adminApi.patch(`/api/admin/stores/${st.id}`, { is_active: !st.is_active });
      setStores(prev => prev.map(x => x.id === st.id ? { ...x, is_active: !x.is_active } : x));
    } catch (e) { alert(e instanceof Error ? e.message : 'Xatolik'); }
  }

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <div>
          <h2 style={s.pageTitle}>Do'konlar</h2>
          {pagination && <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Jami {pagination.total} ta do'kon</p>}
        </div>
        <button onClick={fetchData} className="admin-btn-icon" style={{ ...s.iconBtn, background: '#f8fafc', border: '1px solid #f1f5f9', width: 36, height: 36, borderRadius: 10 }}>
          <RefreshCw size={15} />
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input placeholder="Do'kon nomi yoki manzil..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ ...s.inp, paddingLeft: 38 }} />
        </div>
      </div>

      {error && <div style={s.errBox}>⚠️ {error}</div>}

      <div style={s.tblWrap}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>{["Do'kon", 'Egasi', 'Telefon', 'Mahsulotlar', 'Status', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={s.empty}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div className="spin" style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%' }} />
                  Yuklanmoqda...
                </div>
              </td></tr>
            ) : stores.length === 0 ? (
              <tr><td colSpan={6} style={s.empty}>
                <Store size={40} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.2 }} />
                Do'kon topilmadi
              </td></tr>
            ) : stores.map(st => (
              <tr key={st.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={s.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>🏪</div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{st.name}</div>
                      {st.address && <div style={{ fontSize: 11, color: '#94a3b8' }}>{st.address}</div>}
                    </div>
                  </div>
                </td>
                <td style={s.td}>
                  <div style={{ fontWeight: 500, color: '#374151' }}>{st.owner_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{st.owner_email}</div>
                </td>
                <td style={{ ...s.td, color: '#64748b' }}>{st.phone || '—'}</td>
                <td style={s.td}>
                  <span style={{ fontWeight: 600, color: '#6366f1', background: '#eff1ff', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>
                    {st.product_count} ta
                  </span>
                </td>
                <td style={s.td}>
                  <button onClick={() => toggleActive(st)} style={{
                    padding: '4px 12px', borderRadius: 20, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: st.is_active ? '#f0fdf4' : '#fef2f2',
                    color: st.is_active ? '#16a34a' : '#dc2626',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.is_active ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
                    {st.is_active ? 'Faol' : 'Nofaol'}
                  </button>
                </td>
                <td style={s.td}>
                  <button onClick={() => del(st.id, st.name)} disabled={deletingId === st.id}
                    className="admin-btn-icon" style={{ ...s.iconBtn, color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ ...s.pageBtn, background: p === page ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff', color: p === page ? '#fff' : '#64748b', border: p === page ? '1px solid transparent' : '1px solid #e2e8f0' }}>{p}</button>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
