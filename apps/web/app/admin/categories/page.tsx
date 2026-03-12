'use client';

import { Pencil, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminI18n } from '../../../src/context/AdminI18nContext';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection, EmptyState, SkeletonRows } from '../../../src/features/admin/components/DataViews';
import { adminApi } from '../../../src/lib/adminApi';
import { useToast } from '../../../src/shared/ui/useToast';

interface Category {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  name_en: string | null;
  slug: string;
  created_at: string;
}

type Lang = 'uz' | 'ru' | 'en';

const LANG_LABELS: Record<Lang, string> = { uz: "O'zbekcha", ru: 'Русский', en: 'English' };
const LANG_CODES: Record<Lang, string> = { uz: 'uz', ru: 'ru', en: 'en' };
const ALL_LANGS: Lang[] = ['uz', 'ru', 'en'];

async function translateText(text: string, from: Lang, to: Lang): Promise<string> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${LANG_CODES[from]}|${LANG_CODES[to]}`
    );
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

function useCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.get<{ categories: Category[] }>('/api/categories'),
  });
}

export default function CategoriesPage() {
  const { t, locale } = useAdminI18n();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useCategories();
  const categories = (data as { categories: Category[] } | null)?.categories ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [lang, setLang] = useState<Lang>('uz');
  const [slug, setSlug] = useState('');
  const [translating, setTranslating] = useState(false);
  const [formError, setFormError] = useState('');

  const autoSlug = (n: string) => n.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const getLocalizedName = (cat: Category, l: Lang) => {
    if (l === 'uz') return cat.name_uz || cat.name || cat.name_ru || cat.name_en || '';
    if (l === 'ru') return cat.name_ru || cat.name || cat.name_uz || cat.name_en || '';
    return cat.name_en || cat.name || cat.name_uz || cat.name_ru || '';
  };

  const buildTranslations = async () => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    setTranslating(true);
    const others = ALL_LANGS.filter(l => l !== lang);
    const results: Record<Lang, string> = { uz: '', ru: '', en: '' };
    results[lang] = trimmed;
    await Promise.all(others.map(async (to) => {
      results[to] = await translateText(trimmed, lang, to);
    }));
    setTranslating(false);
    return results;
  };

  const createMut = useMutation({
    mutationFn: async () => {
      const tr = await buildTranslations();
      if (!tr) throw new Error('Nom kiriting');
      return adminApi.createCategory({
        name: tr[lang],
        name_uz: tr.uz,
        name_ru: tr.ru,
        name_en: tr.en,
        slug: slug.trim(),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); closeForm(); showToast({ message: "Yaratildi", type: 'success' }); },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      const tr = await buildTranslations();
      if (!tr) throw new Error('Nom kiriting');
      return adminApi.updateCategory(editCat!.id, {
        name: tr[lang],
        name_uz: tr.uz,
        name_ru: tr.ru,
        name_en: tr.en,
        slug: slug.trim() || undefined,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); closeForm(); showToast({ message: "Yangilandi", type: 'success' }); },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); setDeleteCat(null); showToast({ message: "O'chirildi", type: 'error' }); },
  });

  const openCreate = () => { setName(''); setLang('uz'); setSlug(''); setFormError(''); setEditCat(null); setFormOpen(true); };
  const openEdit = (cat: Category) => {
    const existing = getLocalizedName(cat, locale);
    const existingLang: Lang =
      locale === 'uz' && cat.name_uz ? 'uz'
      : locale === 'ru' && cat.name_ru ? 'ru'
      : locale === 'en' && cat.name_en ? 'en'
      : cat.name_uz ? 'uz'
      : cat.name_ru ? 'ru'
      : 'en';
    setName(existing);
    setLang(existingLang);
    setSlug(cat.slug);
    setFormError('');
    setEditCat(cat);
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditCat(null); setTranslating(false); };

  const isPending = createMut.isPending || updateMut.isPending || translating;
  const canSubmit = name.trim() && slug.trim();

  return (
    <AdminShell
      title={t('categories.title')}
      actions={
        <button onClick={openCreate} className="admin-btn flex items-center gap-2 px-4 py-2 text-sm">
          <Plus className="size-4" /> Kategoriya qo&apos;shish
        </button>
      }
    >
      <AdminPageSection title={t('categories.title')} description={t('categories.dbDesc')} />

      {isLoading ? (
        <SkeletonRows />
      ) : categories.length === 0 ? (
        <EmptyState title={t('categories.empty')} description={t('categories.emptyDesc')} />
      ) : (
        <section className="admin-card p-4">
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] px-4 py-3">
                <div>
                  <p className="font-semibold">{getLocalizedName(cat, locale)}</p>
                  {(cat.name_ru || cat.name_en) && (
                    <p className="text-xs text-[var(--admin-muted)]">
                      {[cat.name_uz && `UZ: ${cat.name_uz}`, cat.name_ru && `RU: ${cat.name_ru}`, cat.name_en && `EN: ${cat.name_en}`].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-xs text-[var(--admin-muted)]">{cat.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="mr-2 text-xs text-[var(--admin-muted)]">{new Date(cat.created_at).toLocaleDateString(locale)}</p>
                  <button onClick={() => openEdit(cat)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-blue-500 transition-colors" title="Tahrirlash">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteCat(cat)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-rose-500 transition-colors" title="O'chirish">
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Create / Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="admin-card relative w-full max-w-sm p-6">
            <button onClick={closeForm} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)]">
              <X size={14} />
            </button>
            <h2 className="mb-4 text-base font-bold">{editCat ? 'Tahrirlash' : 'Yangi kategoriya'}</h2>
            <div className="space-y-3">
              {/* Language selector */}
              <div>
                <span className="mb-1 block text-xs font-semibold text-[var(--admin-muted)]">Til</span>
                <div className="flex gap-1.5">
                  {ALL_LANGS.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold border transition-all ${lang === l ? 'bg-[var(--admin-accent)] text-white border-[var(--admin-accent)]' : 'border-[var(--admin-border)] text-[var(--admin-muted)] hover:border-[var(--admin-accent)]/50'}`}
                    >
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Single name input */}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--admin-muted)]">
                  Nomi ({LANG_LABELS[lang]})
                </span>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (!editCat) setSlug(autoSlug(e.target.value)); }}
                  className="admin-input w-full"
                  placeholder="Masalan: Kiyimlar"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--admin-muted)]">Slug</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="admin-input w-full"
                  placeholder="masalan: kiyimlar"
                />
              </label>

              {translating && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--admin-muted)]">
                  <Loader2 size={12} className="animate-spin" /> Boshqa tillarga tarjima qilinmoqda...
                </p>
              )}
            </div>

            {formError && <p className="mt-2 text-xs text-rose-500">{formError}</p>}
            <div className="mt-5 flex gap-2">
              <button onClick={closeForm} className="flex-1 rounded-full border border-[var(--admin-border)] py-2 text-sm">Bekor</button>
              <button
                disabled={isPending || !canSubmit}
                onClick={() => editCat ? updateMut.mutate() : createMut.mutate()}
                className="flex-1 rounded-full bg-[var(--admin-accent)] py-2 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isPending ? <><Loader2 size={13} className="animate-spin" /> ...</> : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="admin-card w-full max-w-sm p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <Trash2 size={22} />
            </div>
            <h2 className="text-base font-bold">Kategoriyani o&apos;chirish</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              <span className="font-semibold text-[var(--admin-fg)]">{getLocalizedName(deleteCat, locale)}</span> o&apos;chirilsinmi?
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setDeleteCat(null)} className="flex-1 rounded-full border border-[var(--admin-border)] py-2 text-sm">Bekor</button>
              <button
                onClick={() => deleteMut.mutate(deleteCat.id)}
                disabled={deleteMut.isPending}
                className="flex-1 rounded-full bg-rose-500 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                O&apos;chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
