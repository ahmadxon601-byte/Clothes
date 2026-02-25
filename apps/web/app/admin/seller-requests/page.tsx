'use client';
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, ClipboardList } from 'lucide-react';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { adminApi } from '../../../src/lib/adminApi';
import { s } from '../../../src/features/admin/styles';

interface SellerRequest { id: string; user_name: string; user_email: string; store_name: string; store_description: string; store_phone: string; store_address: string; status: 'pending' | 'approved' | 'rejected'; created_at: string; }
interface Pagination { page: number; limit: number; total: number; pages: number; }

function StatusBadge({ status }: { status: string }) {
  const cfg =
    status === 'approved' ? { label: 'Tasdiqlangan', bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' } :
    status === 'rejected'  ? { label: 'Rad etilgan',  bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' } :
                             { label: 'Kutilmoqda',   bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
}

const FILTERS = [
  { val: 'pending',  label: 'Kutilmoqda' },
  { val: 'approved', label: 'Tasdiqlangan' },
  { val: 'rejected', label: 'Rad etilgan' },
  { val: '',         label: 'Hammasi' },
];

export default function SellerRequestsPage() {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) p.set('status', statusFilter);
      const res = await adminApi.get<{ requests: SellerRequest[]; pagination: Pagination }>(`/api/admin/seller-requests?${p}`);
      setRequests(res.requests); setPagination(res.pagination);
    } catch (e) { setError(e instanceof Error ? e.message : 'Xatolik'); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function action(id: string, status: 'approved' | 'rejected') {
    if (!confirm(status === 'approved' ? 'Tasdiqlaysizmi?' : 'Rad etasizmi?')) return;
    setProcessingId(id);
    try {
      await adminApi.patch(`/api/admin/seller-requests/${id}`, { status });
      if (statusFilter === 'pending') setRequests(p => p.filter(r => r.id !== id));
      else setRequests(p => p.map(r => r.id === id ? { ...r, status } : r));
    } catch (e) { alert(e instanceof Error ? e.message : 'Xatolik'); }
    finally { setProcessingId(null); }
  }

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <div>
          <h2 style={s.pageTitle}>Seller So'rovlari</h2>
          {pagination && <p style={{ fontSize: 13, color: 'var(--adm-t3)', marginTop: 2 }}>Jami {pagination.total} ta so'rov</p>}
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

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: 'var(--adm-t4)' }}>
          <div className="spin" style={{ width: 20, height: 20, border: '2px solid var(--adm-border)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
          Yuklanmoqda...
        </div>
      ) : requests.length === 0 ? (
        <div style={{ ...s.tblWrap, padding: '48px 20px', textAlign: 'center', color: 'var(--adm-t4)', fontSize: 14 }}>
          <ClipboardList size={40} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.2 }} />
          So'rovlar topilmadi
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(r => (
            <div key={r.id} style={{ background: 'var(--adm-card)', borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--adm-shadow)', border: '1px solid var(--adm-border)', transition: 'box-shadow 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #eff1ff, #e0e7ff)', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏪</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--adm-t1)' }}>{r.store_name}</div>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '6px 20px' }}>
                    <InfoRow label="Arizakor" value={r.user_name} />
                    <InfoRow label="Email" value={r.user_email} />
                    {r.store_phone       && <InfoRow label="Telefon" value={r.store_phone} />}
                    {r.store_address     && <InfoRow label="Manzil"  value={r.store_address} />}
                    {r.store_description && <InfoRow label="Tavsif"  value={r.store_description} full />}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--adm-t4)', marginTop: 10 }}>
                    {new Date(r.created_at).toLocaleString('uz-UZ')}
                  </div>
                </div>

                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignSelf: 'flex-start', marginTop: 4 }}>
                    <button onClick={() => action(r.id, 'approved')} disabled={processingId === r.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)', opacity: processingId === r.id ? 0.6 : 1 }}>
                      <CheckCircle size={14} /> Tasdiqlash
                    </button>
                    <button onClick={() => action(r.id, 'rejected')} disabled={processingId === r.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(239,68,68,0.3)', opacity: processingId === r.id ? 0.6 : 1 }}>
                      <XCircle size={14} /> Rad etish
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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

function InfoRow({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ fontSize: 11, color: 'var(--adm-t4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}: </span>
      <span style={{ fontSize: 13, color: 'var(--adm-t2)' }}>{value}</span>
    </div>
  );
}
