'use client';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ShoppingCart } from 'lucide-react';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { adminApi } from '../../../src/lib/adminApi';
import { s } from '../../../src/features/admin/styles';

interface Order { id: string; status: string; total_price: number; address: string; created_at: string; user_name: string; user_email: string; items_count: number; }
interface Pagination { page: number; limit: number; total: number; pages: number; }

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function statusCfg(status: string) {
  switch (status) {
    case 'delivered':  return { bg: '#f0fdf4', color: '#16a34a', label: 'Yetkazildi' };
    case 'shipped':    return { bg: '#eff6ff', color: '#2563eb', label: "Yo'lda" };
    case 'processing': return { bg: '#fffbeb', color: '#d97706', label: 'Tayyorlanmoqda' };
    case 'cancelled':  return { bg: '#fef2f2', color: '#dc2626', label: 'Bekor qilindi' };
    default:           return { bg: 'var(--adm-hover)', color: 'var(--adm-t3)', label: 'Kutilmoqda' };
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Kutilmoqda', processing: 'Tayyorlanmoqda',
  shipped: "Yo'lda", delivered: 'Yetkazildi', cancelled: 'Bekor qilindi',
};

const FILTERS = [{ val: '', label: 'Hammasi' }, ...STATUS_OPTIONS.map(st => ({ val: st, label: STATUS_LABELS[st] }))];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) p.set('status', statusFilter);
      const res = await adminApi.get<{ orders: Order[]; pagination: Pagination }>(`/api/admin/orders?${p}`);
      setOrders(res.orders); setPagination(res.pagination);
    } catch (e) { setError(e instanceof Error ? e.message : 'Xatolik'); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function updateStatus(o: Order, newStatus: string) {
    if (newStatus === o.status) return;
    setUpdatingId(o.id);
    try {
      await adminApi.patch('/api/admin/orders', { id: o.id, status: newStatus });
      setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: newStatus } : x));
    } catch (e) { alert(e instanceof Error ? e.message : 'Xatolik'); }
    finally { setUpdatingId(null); }
  }

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <div>
          <h2 style={s.pageTitle}>Buyurtmalar</h2>
          {pagination && <p style={{ fontSize: 13, color: 'var(--adm-t3)', marginTop: 2 }}>Jami {pagination.total} ta buyurtma</p>}
        </div>
        <button onClick={fetchData} className="admin-btn-icon" style={{ ...s.iconBtn, background: 'var(--adm-hover)', border: '1px solid var(--adm-border)', width: 36, height: 36, borderRadius: 10 }}>
          <RefreshCw size={15} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.val} onClick={() => { setStatusFilter(f.val); setPage(1); }} style={s.filterBtn(statusFilter === f.val)}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <div style={s.errBox}>⚠️ {error}</div>}

      <div style={s.tblWrap}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['#ID', 'Mijoz', 'Narx', 'Mahsulotlar', 'Manzil', 'Status', 'Sana'].map(h => (
                <th key={h} style={s.th}>{h}</th>
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
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} style={s.empty}>
                <ShoppingCart size={40} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.2 }} />
                Buyurtma topilmadi
              </td></tr>
            ) : orders.map(o => {
              const cfg = statusCfg(o.status);
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--adm-border)' }}>
                  <td style={s.td}>
                    <span style={{ fontSize: 11, color: 'var(--adm-t4)', fontFamily: 'monospace', background: 'var(--adm-hover)', padding: '2px 6px', borderRadius: 4 }}>
                      {o.id.slice(0, 8)}…
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 500, color: 'var(--adm-t1)' }}>{o.user_name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--adm-t4)' }}>{o.user_email}</div>
                  </td>
                  <td style={{ ...s.td, fontWeight: 600, color: 'var(--adm-t1)', whiteSpace: 'nowrap' }}>
                    {Number(o.total_price).toLocaleString()} <span style={{ fontSize: 11, color: 'var(--adm-t4)', fontWeight: 400 }}>so'm</span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontWeight: 600, color: '#6366f1', background: '#eff1ff', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>
                      {o.items_count} ta
                    </span>
                  </td>
                  <td style={{ ...s.td, color: 'var(--adm-t3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.address || '—'}
                  </td>
                  <td style={s.td}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <select value={o.status} disabled={updatingId === o.id}
                        onChange={e => updateStatus(o, e.target.value)}
                        style={{
                          padding: '5px 10px', borderRadius: 20, border: `1px solid ${cfg.color}40`,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          background: cfg.bg, color: cfg.color, outline: 'none',
                          appearance: 'none', paddingRight: 24,
                          opacity: updatingId === o.id ? 0.6 : 1,
                        }}>
                        {STATUS_OPTIONS.map(st => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
                      </select>
                      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 9, color: cfg.color }}>▼</span>
                    </div>
                  </td>
                  <td style={{ ...s.td, color: 'var(--adm-t4)', whiteSpace: 'nowrap' }}>
                    {new Date(o.created_at).toLocaleDateString('uz-UZ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ ...s.pageBtn, background: p === page ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--adm-card)', color: p === page ? '#fff' : 'var(--adm-t3)', border: p === page ? '1px solid transparent' : '1px solid var(--adm-border2)' }}>{p}</button>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
