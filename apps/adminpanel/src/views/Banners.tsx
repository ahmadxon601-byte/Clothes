'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { AppCard } from '../components/ui/AppCard';
import { AppButton } from '../components/ui/AppButton';
import { IconButton } from '../components/ui/IconButton';
import { useI18n } from '../context/I18nContext';

type Banner = {
  id: string;
  title: string;
  image: string;
  link: string;
  active: boolean;
  createdAt: string;
};

const STORAGE_KEY = 'adminpanel_banners_v1';

export default function Banners() {
  const { t } = useI18n();
  const [items, setItems] = useState<Banner[]>([]);
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try { setItems(JSON.parse(raw) as Banner[]); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !image.trim()) return;
    setItems((prev) => [{
      id: crypto.randomUUID(),
      title: title.trim(),
      image: image.trim(),
      link: link.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setTitle('');
    setImage('');
    setLink('');
  }

  const activeCount = useMemo(() => items.filter((b) => b.active).length, [items]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-main tracking-tight">{t('banners.title')}</h2>
        <p className="text-sm text-muted font-medium mt-1">{t('banners.subtitle')}</p>
      </div>

      <AppCard className="p-5">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={onAdd}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('banners.titlePlaceholder')} className="px-4 py-2.5 rounded-xl bg-pill border border-border outline-none focus:ring-2 focus:ring-accent/40" />
          <input value={image} onChange={(e) => setImage(e.target.value)} placeholder={t('banners.imagePlaceholder')} className="px-4 py-2.5 rounded-xl bg-pill border border-border outline-none focus:ring-2 focus:ring-accent/40" />
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder={t('banners.linkPlaceholder')} className="px-4 py-2.5 rounded-xl bg-pill border border-border outline-none focus:ring-2 focus:ring-accent/40" />
          <AppButton type="submit" leftIcon={<ImagePlus size={16} />}>{t('banners.add')}</AppButton>
        </form>
      </AppCard>

      <AppCard className="p-4 text-sm text-muted">
        {t('common.total')}: {items.length}, {t('common.active').toLowerCase()}: {activeCount}
      </AppCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((b) => (
          <AppCard key={b.id} className="p-4">
            <div className="flex items-start gap-4">
              <img src={b.image} alt={b.title} className="w-24 h-16 rounded-xl object-cover border border-border" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-main truncate">{b.title}</p>
                <p className="text-xs text-muted truncate mt-1">{b.link || t('banners.noLink')}</p>
                <div className="mt-3 flex items-center gap-2">
                  <AppButton size="sm" variant={b.active ? 'secondary' : 'primary'} onClick={() => setItems((prev) => prev.map((x) => x.id === b.id ? { ...x, active: !x.active } : x))}>
                    {b.active ? t('common.active') : t('common.inactive')}
                  </AppButton>
                </div>
              </div>
              <IconButton size="sm" variant="ghost" className="text-red-500" onClick={() => setItems((prev) => prev.filter((x) => x.id !== b.id))}>
                <Trash2 size={16} />
              </IconButton>
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  );
}
