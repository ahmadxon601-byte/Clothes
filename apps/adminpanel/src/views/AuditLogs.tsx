'use client';

import { useEffect, useMemo, useState } from 'react';
import { History, Trash2 } from 'lucide-react';
import { AppCard } from '../components/ui/AppCard';
import { AppButton } from '../components/ui/AppButton';
import { SearchPill } from '../components/ui/SearchPill';
import { useI18n } from '../context/I18nContext';

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  at: string;
};

const STORAGE_KEY = 'adminpanel_audit_logs_v1';

export default function AuditLogs() {
  const { t } = useI18n();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setItems(JSON.parse(raw) as AuditLog[]); return; } catch { /* noop */ }
    }
    setItems([
      { id: crypto.randomUUID(), actor: 'admin@clothes.uz', action: 'Admin panelga kirdi', at: new Date().toISOString() },
    ]);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filtered = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (!v) return items;
    return items.filter((i) => i.actor.toLowerCase().includes(v) || i.action.toLowerCase().includes(v));
  }, [items, q]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-main tracking-tight">{t('audit.title')}</h2>
          <p className="text-sm text-muted font-medium mt-1">{t('audit.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <AppButton variant="secondary" onClick={() => setItems((prev) => [{ id: crypto.randomUUID(), actor: 'admin@clothes.uz', action: 'Manual log created', at: new Date().toISOString() }, ...prev])}>
            {t('audit.add')}
          </AppButton>
          <AppButton variant="danger" onClick={() => setItems([])} leftIcon={<Trash2 size={16} />}>{t('audit.clear')}</AppButton>
        </div>
      </div>

      <AppCard className="p-4">
        <SearchPill placeholder={t('audit.search')} value={q} onChange={(e) => setQ(e.target.value)} containerClassName="w-full md:max-w-md" />
      </AppCard>

      <div className="space-y-3">
        {filtered.map((l) => (
          <AppCard key={l.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-pill border border-border flex items-center justify-center">
                <History size={16} className="text-muted" />
              </div>
              <div>
                <p className="text-main font-semibold">{l.action}</p>
                <p className="text-sm text-muted mt-1">{l.actor}</p>
                <p className="text-xs text-muted mt-1">{new Date(l.at).toLocaleString('uz-UZ')}</p>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  );
}
