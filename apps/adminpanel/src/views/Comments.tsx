'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageSquareWarning, Trash2 } from 'lucide-react';
import { AppCard } from '../components/ui/AppCard';
import { AppButton } from '../components/ui/AppButton';
import { SearchPill } from '../components/ui/SearchPill';
import { useI18n } from '../context/I18nContext';

type CommentItem = {
  id: string;
  author: string;
  product: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

const STORAGE_KEY = 'adminpanel_comments_v1';

const SEED: CommentItem[] = [
  { id: 'c1', author: 'Ali V.', product: 'Classic Hoodie', text: "Sifati zo'r, tez yetib keldi.", status: 'pending', createdAt: new Date().toISOString() },
  { id: 'c2', author: 'Dilnoza R.', product: 'Leather Jacket', text: 'Rasmdagidan sal boshqacharoq rang.', status: 'approved', createdAt: new Date().toISOString() },
];

export default function Comments() {
  const { t } = useI18n();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setItems(SEED);
      return;
    }
    try { setItems(JSON.parse(raw) as CommentItem[]); } catch { setItems(SEED); }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filtered = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (!v) return items;
    return items.filter((i) =>
      i.author.toLowerCase().includes(v) ||
      i.product.toLowerCase().includes(v) ||
      i.text.toLowerCase().includes(v)
    );
  }, [items, q]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-main tracking-tight">{t('comments.title')}</h2>
        <p className="text-sm text-muted font-medium mt-1">{t('comments.subtitle')}</p>
      </div>

      <AppCard className="p-4">
        <SearchPill value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('comments.search')} containerClassName="w-full md:max-w-lg" />
      </AppCard>

      <div className="space-y-3">
        {filtered.map((c) => (
          <AppCard key={c.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-main">{c.author} · <span className="text-muted font-medium">{c.product}</span></p>
                <p className="text-sm text-main/90 mt-2">{c.text}</p>
                <p className="text-xs text-muted mt-2">{new Date(c.createdAt).toLocaleString('uz-UZ')}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <AppButton size="sm" variant={c.status === 'approved' ? 'primary' : 'secondary'} onClick={() => setItems((prev) => prev.map((x) => x.id === c.id ? { ...x, status: 'approved' } : x))}>
                  {t('comments.approve')}
                </AppButton>
                <AppButton size="sm" variant={c.status === 'rejected' ? 'danger' : 'secondary'} onClick={() => setItems((prev) => prev.map((x) => x.id === c.id ? { ...x, status: 'rejected' } : x))}>
                  {t('comments.reject')}
                </AppButton>
                <button className="p-2 rounded-xl text-red-500 hover:bg-red-500/10" onClick={() => setItems((prev) => prev.filter((x) => x.id !== c.id))}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      {!filtered.length && (
        <AppCard className="p-8 text-center">
          <MessageSquareWarning size={20} className="mx-auto text-muted mb-2" />
          <p className="text-muted">{t('comments.empty')}</p>
        </AppCard>
      )}
    </div>
  );
}
