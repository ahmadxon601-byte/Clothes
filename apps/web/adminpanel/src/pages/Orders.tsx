import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

interface Order {
  id: string;
  status: string;
  total_price: number;
  address: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
  items_count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function statusStyle(s: string) {
  switch (s) {
    case 'delivered': return { bg: '#f0fdf4', color: '#16a34a', label: 'Yetkazildi' };
    case 'shipped': return { bg: '#eff6ff', color: '#2563eb', label: 'Yo\'lda' };
    case 'processing': return { bg: '#fffbeb', color: '#d97706', label: 'Tayyorlanmoqda' };
    case 'cancelled': return { bg: '#fef2f2', color: '#dc2626', label: 'Bekor qilindi' };
    default: return { bg: '#f8fafc', color: '#64748b', label: 'Kutilmoqda' };
  }
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<{ orders: Order[]; pagination: Pagination }>(
        `/api/admin/orders?${params}`
      );
      setOrders(res.orders);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function updateStatus(order: Order, newStatus: string) {
    if (newStatus === order.status) return;
    setUpdatingId(order.id);
    try {
      await api.patch('/api/admin/orders', { id: order.id, status: newStatus });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Buyurtmalar</h2>
        <button onClick={fetchOrders} style={iconBtnStyle}><RefreshCw size={16} /></button>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ val: '', label: 'Hammasi' }, ...STATUS_OPTIONS.map(s => ({ val: s, label: statusStyle(s).label }))].map(opt => (
          <button
            key={opt.val}
            onClick={() => { setStatusFilter(opt.val); setPage(1); }}
            style={{
              padding: '7px 16px', borderRadius: 20, border: '1px solid',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
              borderColor: statusFilter === opt.val ? '#3b82f6' : '#e2e8f0',
              background: statusFilter === opt.val ? '#3b82f6' : '#fff',
              color: statusFilter === opt.val ? '#fff' : '#374151',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={tableContainer}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['#ID', 'Mijoz', 'Narx', 'Mahsulotlar', 'Manzil', 'Status', 'Sana'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Yuklanmoqda...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Buyurtma topilmadi</td></tr>
            ) : orders.map(o => {
              const ss = statusStyle(o.status);
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {o.id.slice(0, 8)}...
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>{o.user_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{o.user_email}</div>
                  </td>
                  <td style={tdStyle}>{Number(o.total_price).toLocaleString()} so'm</td>
                  <td style={tdStyle}>{o.items_count} ta</td>
                  <td style={tdStyle}>{o.address || '—'}</td>
                  <td style={tdStyle}>
                    <select
                      value={o.status}
                      disabled={updatingId === o.id}
                      onChange={e => updateStatus(o, e.target.value)}
                      style={{
                        padding: '4px 8px', borderRadius: 6, border: `1px solid ${ss.color}`,
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: ss.bg, color: ss.color, outline: 'none',
                      }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{statusStyle(s).label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>{new Date(o.created_at).toLocaleDateString('uz-UZ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              width: 32, height: 32, border: '1px solid #e2e8f0',
              borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: p === page ? '#3b82f6' : '#fff',
              color: p === page ? '#fff' : '#374151',
            }}>{p}</button>
          ))}
        </div>
      )}

      {pagination && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
          Jami: {pagination.total} ta buyurtma
        </div>
      )}
    </div>
  );
}

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
const errorStyle: React.CSSProperties = {
  background: '#fef2f2', border: '1px solid #fecaca',
  borderRadius: 8, padding: '12px 16px', color: '#dc2626',
  marginBottom: 16, fontSize: 13,
};
