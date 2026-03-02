'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../context/I18nContext';
import { AppCard } from '../components/ui/AppCard';
import { IconButton } from '../components/ui/IconButton';
import { AppButton } from '../components/ui/AppButton';

interface Stats {
  users_count: number;
  products_count: number;
  stores_count: number;
  pending_seller_requests: number;
}

export default function Reports() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<Stats>('/api/admin/stats');
      setStats(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function exportJson() {
    if (!stats) return;
    const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), stats }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-main tracking-tight">{t('reports.title')}</h2>
          <p className="text-sm text-muted font-medium mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <IconButton onClick={load} variant="soft" disabled={loading}><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></IconButton>
          <AppButton variant="secondary" onClick={exportJson} leftIcon={<Download size={16} />} disabled={!stats}>{t('reports.export')}</AppButton>
        </div>
      </div>

      {error && <AppCard className="p-4 border-red-500/30 text-red-500">{error}</AppCard>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AppCard className="p-5"><p className="text-muted text-sm">{t('dashboard.users')}</p><p className="text-3xl font-bold mt-2">{stats?.users_count ?? '-'}</p></AppCard>
        <AppCard className="p-5"><p className="text-muted text-sm">{t('dashboard.products')}</p><p className="text-3xl font-bold mt-2">{stats?.products_count ?? '-'}</p></AppCard>
        <AppCard className="p-5"><p className="text-muted text-sm">{t('dashboard.stores')}</p><p className="text-3xl font-bold mt-2">{stats?.stores_count ?? '-'}</p></AppCard>
        <AppCard className="p-5"><p className="text-muted text-sm">{t('reports.pendingRequests')}</p><p className="text-3xl font-bold mt-2">{stats?.pending_seller_requests ?? '-'}</p></AppCard>
      </div>
    </div>
  );
}
