import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../context/I18nContext';
import { IconButton } from '../components/ui/IconButton';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { AppCard } from '../components/ui/AppCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AppButton } from '../components/ui/AppButton';

interface SellerRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  store_name: string;
  store_description: string;
  phone: string;
  address: string;
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
  const { t } = useI18n();
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
      if (statusFilter === 'all') {
        const [pending, approved, rejected] = await Promise.all([
          api.get<{ requests: SellerRequest[] }>('/api/admin/seller-requests?page=1&limit=100&status=pending'),
          api.get<{ requests: SellerRequest[] }>('/api/admin/seller-requests?page=1&limit=100&status=approved'),
          api.get<{ requests: SellerRequest[] }>('/api/admin/seller-requests?page=1&limit=100&status=rejected'),
        ]);
        const all = [...(pending.requests || []), ...(approved.requests || []), ...(rejected.requests || [])]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRequests(all);
        setPagination({ page: 1, limit: all.length || 1, total: all.length, pages: 1 });
      } else {
        const params = new URLSearchParams({ page: String(page), limit: '20', status: statusFilter });
        const res = await api.get<{ requests: SellerRequest[]; pagination: Pagination }>(
          `/api/admin/seller-requests?${params}`
        );
        setRequests(res.requests);
        setPagination(res.pagination);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    if (!confirm(action === 'approved' ? t('applications.confirmApprove') : t('applications.confirmReject'))) return;
    setProcessingId(id);
    try {
      await api.put(`/api/admin/seller-requests/${id}`, {
        action: action === 'approved' ? 'approve' : 'reject',
      });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
      if (statusFilter === 'pending') {
        setRequests(prev => prev.filter(r => r.id !== id));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setProcessingId(null);
    }
  }

  const getStatusBadge = (s: string) => {
    if (s === 'approved') return <StatusBadge status="active" label={t('applications.approved')} />;
    if (s === 'rejected') return <StatusBadge status="rejected" label={t('applications.rejected')} />;
    return <StatusBadge status="pending" label={t('applications.pending')} />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold text-main tracking-tight">{t('applications.title')}</h2>
          <p className="text-sm text-muted font-medium">{t('applications.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <IconButton onClick={fetchRequests} variant="soft" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </IconButton>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="text-xs uppercase tracking-wider font-semibold text-muted">{t('applications.filter')}</div>
          <div className="text-xs font-semibold text-muted bg-pill border border-border/60 rounded-full px-3 py-1.5 w-fit">
            {t('common.total')}: {pagination?.total ?? 0}
          </div>
        </div>
        <div className="overflow-x-auto pb-1">
          <SegmentedControl
            options={[
              { label: t('applications.pending'), value: 'pending' },
              { label: t('applications.approved'), value: 'approved' },
              { label: t('applications.rejected'), value: 'rejected' },
              { label: t('applications.all'), value: 'all' },
            ]}
            value={statusFilter}
            onChange={val => { setStatusFilter(val); setPage(1); }}
            className="w-full sm:w-auto min-w-[360px]"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl font-medium text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center p-12 text-muted font-medium flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-accent" size={24} />
          {t('common.loading')}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-2xl border border-border text-muted font-medium bg-stripes flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pill border border-border/70 flex items-center justify-center">
            <Clock size={20} className="text-muted" />
          </div>
          <div className="text-base text-main font-semibold">{t('applications.empty')}</div>
          <div className="text-sm text-muted">{t('applications.emptyHint')}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {requests.map(r => (
            <AppCard key={r.id} className="p-5 md:p-6 flex flex-col h-full hover:border-accent/40 transition-colors">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-main">{r.store_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                    <Clock size={14} />
                    {new Date(r.created_at).toLocaleString('uz-UZ', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                {getStatusBadge(r.status)}
              </div>

              <div className="flex-1 space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-3 rounded-xl bg-pill border border-border/50">
                    <div className="text-xs font-semibold text-muted uppercase tracking-wider">{t('applications.requester')}</div>
                    <div className="text-sm font-medium text-main">{r.user_name}</div>
                    <div className="text-xs text-muted break-all">{r.user_email}</div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-pill border border-border/50">
                    <div className="text-xs font-semibold text-muted uppercase tracking-wider">{t('applications.contact')}</div>
                    <div className="text-sm font-medium text-main">{r.phone || '-'}</div>
                    <div className="text-xs text-muted line-clamp-1" title={r.address}>{r.address || '-'}</div>
                  </div>
                </div>

                {r.store_description && (
                  <div className="space-y-1.5 border-t border-border/50 pt-4">
                    <div className="text-xs font-semibold text-muted uppercase tracking-wider">{t('applications.description')}</div>
                    <p className="text-sm text-main/90 leading-relaxed bg-pill p-3 rounded-xl">
                      {r.store_description}
                    </p>
                  </div>
                )}
              </div>

              {r.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-border mt-auto">
                  <AppButton
                    variant="primary"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                    onClick={() => handleAction(r.id, 'approved')}
                    isLoading={processingId === r.id}
                    disabled={processingId !== null}
                    leftIcon={<CheckCircle size={18} />}
                  >
                    {t('applications.approve')}
                  </AppButton>
                  <AppButton
                    variant="danger"
                    className="flex-1"
                    onClick={() => handleAction(r.id, 'rejected')}
                    isLoading={processingId === r.id}
                    disabled={processingId !== null}
                    leftIcon={<XCircle size={18} />}
                  >
                    {t('applications.reject')}
                  </AppButton>
                </div>
              )}
            </AppCard>
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-full font-medium transition-all duration-200 ${p === page
                ? 'bg-accent text-white shadow-md'
                : 'bg-pill text-main hover:bg-border'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
