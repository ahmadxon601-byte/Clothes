import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

interface SellerRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  store_name: string;
  store_description: string;
  store_phone: string;
  store_address: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function SellerRequests() {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<{ requests: SellerRequest[]; pagination: Pagination }>(
        `/api/admin/seller-requests?${params}`
      );
      setRequests(res.requests);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    const label = action === 'approved' ? 'tasdiqlaysizmi' : 'rad etasizmi';
    if (!confirm(`Bu so'rovni ${label}?`)) return;
    setProcessingId(id);
    try {
      await api.patch(`/api/admin/seller-requests/${id}`, { status: action });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
      // Remove from pending list if filtered
      if (statusFilter === 'pending') {
        setRequests(prev => prev.filter(r => r.id !== id));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setProcessingId(null);
    }
  }

  function statusBadge(s: string) {
    if (s === 'approved') return { label: 'Tasdiqlangan', bg: '#f0fdf4', color: '#16a34a' };
    if (s === 'rejected') return { label: 'Rad etilgan', bg: '#fef2f2', color: '#dc2626' };
    return { label: 'Kutilmoqda', bg: '#fffbeb', color: '#d97706' };
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Seller So'rovlari</h2>
        <button onClick={fetchRequests} style={iconBtnStyle}><RefreshCw size={16} /></button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{
              padding: '7px 16px', borderRadius: 20, border: '1px solid',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
              borderColor: statusFilter === s ? '#3b82f6' : '#e2e8f0',
              background: statusFilter === s ? '#3b82f6' : '#fff',
              color: statusFilter === s ? '#fff' : '#374151',
            }}
          >
            {s === '' ? 'Hammasi' : s === 'pending' ? 'Kutilmoqda' : s === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}
          </button>
        ))}
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Yuklanmoqda...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', borderRadius: 12 }}>
          So'rovlar topilmadi
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(r => {
            const badge = statusBadge(r.status);
            return (
              <div key={r.id} style={{
                background: '#fff', borderRadius: 12, padding: 20,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 16, color: '#1e293b' }}>{r.store_name}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                      <strong>Arizakor:</strong> {r.user_name} ({r.user_email})
                    </div>
                    {r.store_description && (
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                        <strong>Tavsif:</strong> {r.store_description}
                      </div>
                    )}
                    {r.store_phone && (
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                        <strong>Telefon:</strong> {r.store_phone}
                      </div>
                    )}
                    {r.store_address && (
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        <strong>Manzil:</strong> {r.store_address}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                      {new Date(r.created_at).toLocaleString('uz-UZ')}
                    </div>
                  </div>

                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleAction(r.id, 'approved')}
                        disabled={processingId === r.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', borderRadius: 8, border: 'none',
                          background: '#10b981', color: '#fff',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <CheckCircle size={15} /> Tasdiqlash
                      </button>
                      <button
                        onClick={() => handleAction(r.id, 'rejected')}
                        disabled={processingId === r.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', borderRadius: 8, border: 'none',
                          background: '#ef4444', color: '#fff',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <XCircle size={15} /> Rad etish
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', color: '#64748b',
};
const errorStyle: React.CSSProperties = {
  background: '#fef2f2', border: '1px solid #fecaca',
  borderRadius: 8, padding: '12px 16px', color: '#dc2626',
  marginBottom: 16, fontSize: 13,
};
