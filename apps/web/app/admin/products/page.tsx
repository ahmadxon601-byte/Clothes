'use client';
import { useEffect, useState, useCallback } from 'react';
import { Trash2, Search, RefreshCw, ShoppingBag, Eye } from 'lucide-react';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { adminApi } from '../../../src/lib/adminApi';
import { s } from '../../../src/features/admin/styles';

interface Product { id: string; name: string; base_price: number; sku: string; views: number; is_active: boolean; created_at: string; category_name: string; store_name: string; thumbnail: string | null; }
interface Pagination { page: number; limit: number; total: number; pages: number; }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
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
      const res = await adminApi.get<{ products: Product[]; pagination: Pagination }>(`/api/admin/products?${p}`);
      setProducts(res.products); setPagination(res.pagination);
    } catch (e) { setError(e instanceof Error ? e.message : 'Xatolik'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function del(id: string, name: string) {
    if (!confirm(`"${name}" mahsulotini o'chirasizmi?`)) return;
    setDeletingId(id);
    try { await adminApi.delete(`/api/admin/products/${id}`); setProducts(p => p.filter(x => x.id !== id)); }
    catch (e) { alert(e instanceof Error ? e.message : 'Xatolik'); }
    finally { setDeletingId(null); }
  }

  async function toggleActive(p: Product) {
    try {
      await adminApi.patch(`/api/admin/products/${p.id}`, { is_active: !p.is_active });
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    } catch (e) { alert(e instanceof Error ? e.message : 'Xatolik'); }
  }

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <div>
          <h2 style={s.pageTitle}>Mahsulotlar</h2>
          {pagination && <p style={{ fontSize: 13, color: 'var(--adm-t3)', marginTop: 2 }}>Jami {pagination.total} ta mahsulot</p>}
        </div>
        <button onClick={fetchData} className="admin-btn-icon" style={{ ...s.iconBtn, background: 'var(--adm-hover)', border: '1px solid var(--adm-border)', width: 36, height: 36, borderRadius: 10 }}>
          <RefreshCw size={15} />
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-t4)' }} />
          <input placeholder="Nom yoki SKU qidirish..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ ...s.inp, paddingLeft: 38 }} />
        </div>
      </div>

      {error && <div style={s.errBox}>⚠️ {error}</div>}

      <div style={s.tblWrap}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Mahsulot', 'Narx', 'Kategoriya', "Do'kon", <span key="v" style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={11} />Ko'rish</span>, 'Status', ''].map((h, i) => (
                <th key={i} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={s.empty}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div className="spin" style={{ width: 18, height: 18, border: '2px solid var(--adm-border)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
                  Yuklanmoqda...
                </div>
              </td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} style={s.empty}>
                <ShoppingBag size={40} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.2 }} />
                Mahsulot topilmadi
              </td></tr>
            ) : products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--adm-border)' }}>
                <td style={s.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--adm-border)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--adm-hover)', border: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ShoppingBag size={16} color="var(--adm-t4)" />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--adm-t1)', marginBottom: 1 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--adm-t4)', fontFamily: 'monospace' }}>{p.sku}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...s.td, fontWeight: 600, color: 'var(--adm-t1)', whiteSpace: 'nowrap' }}>
                  {Number(p.base_price).toLocaleString()} <span style={{ fontSize: 11, color: 'var(--adm-t4)', fontWeight: 400 }}>so'm</span>
                </td>
                <td style={{ ...s.td, color: 'var(--adm-t3)' }}>
                  {p.category_name
                    ? <span style={{ padding: '3px 8px', background: 'var(--adm-hover)', borderRadius: 6, fontSize: 12, border: '1px solid var(--adm-border)' }}>{p.category_name}</span>
                    : '—'}
                </td>
                <td style={{ ...s.td, color: 'var(--adm-t3)' }}>{p.store_name || '—'}</td>
                <td style={{ ...s.td, color: 'var(--adm-t3)', fontWeight: 500 }}>{p.views.toLocaleString()}</td>
                <td style={s.td}>
                  <button onClick={() => toggleActive(p)} style={{
                    padding: '4px 12px', borderRadius: 20, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: p.is_active ? '#f0fdf4' : '#fef2f2',
                    color: p.is_active ? '#16a34a' : '#dc2626',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.is_active ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
                    {p.is_active ? 'Faol' : 'Nofaol'}
                  </button>
                </td>
                <td style={s.td}>
                  <button onClick={() => del(p.id, p.name)} disabled={deletingId === p.id}
                    className="admin-btn-icon" style={{ ...s.iconBtn, color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar pagination={pagination} page={page} setPage={setPage} />
    </AdminShell>
  );
}

function PaginationBar({ pagination, page, setPage }: { pagination: Pagination | null; page: number; setPage: (p: number) => void }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => setPage(p)} style={{
          ...s.pageBtn,
          background: p === page ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--adm-card)',
          color: p === page ? '#fff' : 'var(--adm-t3)',
          border: p === page ? '1px solid transparent' : '1px solid var(--adm-border2)',
        }}>{p}</button>
      ))}
    </div>
  );
}
