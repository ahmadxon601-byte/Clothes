import { useEffect, useState, useCallback } from 'react';
import { Trash2, Search, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

interface Store {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  product_count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await api.get<{ stores: Store[]; pagination: Pagination }>(
        `/api/admin/stores?${params}`
      );
      setStores(res.stores);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  async function deleteStore(id: string, name: string) {
    if (!confirm(`"${name}" do'konini o'chirasizmi?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/admin/stores/${id}`);
      setStores(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'O\'chirishda xatolik');
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(store: Store) {
    try {
      await api.patch(`/api/admin/stores/${store.id}`, { is_active: !store.is_active });
      setStores(prev => prev.map(s => s.id === store.id ? { ...s, is_active: !s.is_active } : s));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xatolik');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Do'konlar</h2>
        <button onClick={fetchStores} style={iconBtnStyle}><RefreshCw size={16} /></button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            placeholder="Do'kon nomi yoki manzil qidirish..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={tableContainer}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Do\'kon nomi', 'Egasi', 'Telefon', 'Mahsulotlar', 'Status', 'Amallar'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Yuklanmoqda...</td></tr>
            ) : stores.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Do'kon topilmadi</td></tr>
            ) : stores.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  {s.address && <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.address}</div>}
                </td>
                <td style={tdStyle}>
                  <div>{s.owner_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.owner_email}</div>
                </td>
                <td style={tdStyle}>{s.phone || '—'}</td>
                <td style={tdStyle}>{s.product_count}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => toggleActive(s)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, border: 'none',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: s.is_active ? '#f0fdf4' : '#fef2f2',
                      color: s.is_active ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {s.is_active ? 'Faol' : 'Nofaol'}
                  </button>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => deleteStore(s.id, s.name)}
                    disabled={deletingId === s.id}
                    style={{ ...iconBtnStyle, color: '#ef4444' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              ...pageBtnStyle,
              background: p === page ? '#3b82f6' : '#fff',
              color: p === page ? '#fff' : '#374151',
            }}>{p}</button>
          ))}
        </div>
      )}

      {pagination && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
          Jami: {pagination.total} ta do'kon
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 14px',
  border: '1px solid #e2e8f0', borderRadius: 8,
  fontSize: 13, outline: 'none', background: '#fff', color: '#1e293b',
};
const tableContainer: React.CSSProperties = {
  background: '#fff', borderRadius: 12, overflow: 'auto',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};
const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontWeight: 600,
  fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #e2e8f0',
};
const tdStyle: React.CSSProperties = { padding: '12px 16px', color: '#374151' };
const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', color: '#64748b',
};
const pageBtnStyle: React.CSSProperties = {
  width: 32, height: 32, border: '1px solid #e2e8f0',
  borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
};
const errorStyle: React.CSSProperties = {
  background: '#fef2f2', border: '1px solid #fecaca',
  borderRadius: 8, padding: '12px 16px', color: '#dc2626',
  marginBottom: 16, fontSize: 13,
};
