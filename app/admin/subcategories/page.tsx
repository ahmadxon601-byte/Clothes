'use client';

import { ChevronDown, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
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
  parent_id?: string | null;
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

export default function SubcategoriesPage() {
  const { t, locale } = useAdminI18n();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useCategories();
  const categories = (data as { categories: Category[] } | null)?.categories ?? [];

  const parents = useMemo(() => categories.filter((item) => !item.parent_id), [categories]);
  const subcategories = useMemo(() => categories.filter((item) => item.parent_id), [categories]);

  const [formOpen, setFormOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [parentId, setParentId] = useState('');
  const [parentMenuOpen, setParentMenuOpen] = useState(false);
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

  const parentName = (id?: string | null) => parents.find((item) => item.id === id);

  const buildTranslations = async () => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    setTranslating(true);
    const others = ALL_LANGS.filter((item) => item !== lang);
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
      if (!parentId) throw new Error('Asosiy kategoriya tanlang');
      return adminApi.createCategory({
        name: tr[lang],
        name_uz: tr.uz,
        name_ru: tr.ru,
        name_en: tr.en,
        slug: slug.trim(),
        parent_id: parentId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      closeForm();
      showToast({ message: "Subkategoriya yaratildi", type: 'success' });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      const tr = await buildTranslations();
      if (!tr) throw new Error('Nom kiriting');
      if (!parentId) throw new Error('Asosiy kategoriya tanlang');
      return adminApi.updateCategory(editCat!.id, {
        name: tr[lang],
        name_uz: tr.uz,
        name_ru: tr.ru,
        name_en: tr.en,
        slug: slug.trim() || undefined,
        parent_id: parentId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      closeForm();
      showToast({ message: 'Subkategoriya yangilandi', type: 'success' });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setDeleteCat(null);
      showToast({ message: "Subkategoriya o'chirildi", type: 'error' });
    },
  });

  const openCreate = () => {
    setName('');
    setLang('uz');
    setSlug('');
    setParentId(parents[0]?.id ?? '');
    setParentMenuOpen(false);
    setFormError('');
    setEditCat(null);
    setFormOpen(true);
  };

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
    setParentId(cat.parent_id ?? '');
    setParentMenuOpen(false);
    setFormError('');
    setEditCat(cat);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditCat(null);
    setParentMenuOpen(false);
    setTranslating(false);
  };
  const submitForm = () => { if (!isPending && canSubmit) (editCat ? updateMut : createMut).mutate(); };

  const isPending = createMut.isPending || updateMut.isPending || translating;
  const canSubmit = name.trim() && slug.trim() && parentId;

  useEffect(() => {
    if (!formOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeForm();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [formOpen]);

  return (
    <AdminShell
      title={t('subcategories.title')}
      actions={
        <button onClick={openCreate} className='admin-btn flex items-center gap-2 px-4 py-2 text-sm shadow-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'>
          <Plus className='size-4' /> Subkategoriya qo&apos;shish
        </button>
      }
    >
      <AdminPageSection title={t('subcategories.title')} description={t('subcategories.dbDesc')} />

      {isLoading ? (
        <SkeletonRows />
      ) : subcategories.length === 0 ? (
        <EmptyState title={t('subcategories.empty')} description={t('subcategories.emptyDesc')} />
      ) : (
        <section className='admin-card p-4'>
          <ul className='space-y-2'>
            {subcategories.map((cat) => (
              <li key={cat.id} className='flex items-center justify-between rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] px-4 py-3'>
                <div>
                  <p className='font-semibold'>{getLocalizedName(cat, locale)}</p>
                  <p className='text-xs text-[var(--admin-muted)]'>
                    Asosiy kategoriya: {parentName(cat.parent_id) ? getLocalizedName(parentName(cat.parent_id)!, locale) : '-'}
                  </p>
                  {(cat.name_ru || cat.name_en) && (
                    <p className='text-xs text-[var(--admin-muted)]'>
                      {[cat.name_uz && `UZ: ${cat.name_uz}`, cat.name_ru && `RU: ${cat.name_ru}`, cat.name_en && `EN: ${cat.name_en}`].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className='text-xs text-[var(--admin-muted)]'>{cat.slug}</p>
                </div>
                <div className='flex items-center gap-2'>
                  <p className='mr-2 text-xs text-[var(--admin-muted)]'>{new Date(cat.created_at).toLocaleDateString(locale)}</p>
                  <button onClick={() => openEdit(cat)} className='flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] bg-transparent text-[var(--admin-muted)] shadow-none outline-none transition-colors hover:bg-transparent hover:text-blue-500 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0' title='Tahrirlash'>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteCat(cat)} className='flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] bg-transparent text-[var(--admin-muted)] shadow-none outline-none transition-colors hover:bg-transparent hover:text-rose-500 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0' title="O'chirish">
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {formOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitForm();
            }}
            className='admin-card relative w-full max-w-sm p-6'
          >
            <button type='button' onClick={closeForm} className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] bg-transparent text-[var(--admin-muted)] shadow-none outline-none transition-colors hover:bg-transparent hover:text-[var(--admin-fg)] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'>
              <X size={14} />
            </button>
            <h2 className='mb-4 text-base font-bold'>{editCat ? 'Subkategoriyani tahrirlash' : 'Yangi subkategoriya'}</h2>
            <div className='space-y-3'>
              <label className='block'>
                <span className='mb-1 block text-xs font-semibold text-[var(--admin-muted)]'>Asosiy kategoriya</span>
                <div className='relative'>
                  <button
                    type='button'
                    onClick={() => parents.length > 0 && setParentMenuOpen((prev) => !prev)}
                    disabled={parents.length === 0}
                    className='admin-input flex w-full items-center justify-between rounded-2xl border border-[var(--admin-border)] bg-[rgba(19,29,46,0.96)] px-4 py-3 text-left text-sm text-[var(--admin-fg)] shadow-none outline-none transition-colors hover:border-[var(--admin-accent)]/35 focus:border-[var(--admin-accent)] focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    <span>{parentName(parentId) ? getLocalizedName(parentName(parentId)!, locale) : 'Kategoriya yo‘q'}</span>
                    <ChevronDown className={`size-4 text-[var(--admin-muted)] transition-transform ${parentMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {parentMenuOpen && parents.length > 0 && (
                    <div className='absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[rgba(12,19,32,0.99)] p-2 shadow-[0_14px_28px_rgba(0,0,0,0.22)]'>
                      <div className='max-h-52 overflow-y-auto pr-1'>
                        <div className='space-y-1'>
                          {parents.map((item) => {
                            const selected = item.id === parentId;
                            return (
                              <button
                                key={item.id}
                                type='button'
                                onClick={() => {
                                  setParentId(item.id);
                                  setParentMenuOpen(false);
                                }}
                                className={`flex w-full items-center rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                                  selected
                                    ? 'border-emerald-500/40 bg-emerald-500/18 text-emerald-50'
                                    : 'border-transparent text-[var(--admin-fg)] hover:border-white/8 hover:bg-white/4'
                                }`}
                              >
                                {getLocalizedName(item, locale)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {parents.length === 0 && (
                  <p className='mt-2 text-xs text-[var(--admin-muted)]'>Avval asosiy kategoriya qo&apos;shing.</p>
                )}
              </label>

              <div>
                <span className='mb-1 block text-xs font-semibold text-[var(--admin-muted)]'>Til</span>
                <div className='flex gap-1.5'>
                  {ALL_LANGS.map((item) => (
                    <button
                      key={item}
                      type='button'
                      onClick={() => setLang(item)}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-bold shadow-none outline-none transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${
                        lang === item
                          ? 'border-[#00bc7d] bg-[#00bc7d] text-white'
                          : 'border-[var(--admin-border)] bg-transparent text-[var(--admin-muted)] hover:border-white/10 hover:text-[var(--admin-fg)]'
                      }`}
                    >
                      {LANG_LABELS[item]}
                    </button>
                  ))}
                </div>
              </div>

              <label className='block'>
                <span className='mb-1 block text-xs font-semibold text-[var(--admin-muted)]'>Nomi ({LANG_LABELS[lang]})</span>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (!editCat) setSlug(autoSlug(e.target.value)); }}
                  className='admin-input w-full'
                  placeholder='Masalan: Smartfonlar'
                />
              </label>

              <label className='block'>
                <span className='mb-1 block text-xs font-semibold text-[var(--admin-muted)]'>Slug</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className='admin-input w-full'
                  placeholder='masalan: smartfonlar'
                />
              </label>

              {translating && (
                <p className='flex items-center gap-1.5 text-xs text-[var(--admin-muted)]'>
                  <Loader2 size={12} className='animate-spin' /> Boshqa tillarga tarjima qilinmoqda...
                </p>
              )}
            </div>

            {formError && <p className='mt-2 text-xs text-rose-500'>{formError}</p>}
            <div className='mt-5 flex gap-2'>
              <button type='button' onClick={closeForm} className='flex-1 rounded-full border border-[var(--admin-border)] bg-transparent py-2 text-sm shadow-none outline-none transition-colors hover:bg-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'>Bekor</button>
              <button
                type='submit'
                disabled={isPending || !canSubmit}
                className='flex-1 rounded-full bg-[var(--admin-accent)] py-2 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'
              >
                {isPending ? <><Loader2 size={13} className='animate-spin' /> ...</> : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteCat && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='admin-card w-full max-w-sm p-6'>
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/8 text-rose-500 shadow-none'>
              <Trash2 size={22} />
            </div>
            <h2 className='text-base font-bold'>Subkategoriyani o&apos;chirish</h2>
            <p className='mt-1 text-sm text-[var(--admin-muted)]'>
              <span className='font-semibold text-[var(--admin-fg)]'>{getLocalizedName(deleteCat, locale)}</span> o&apos;chirilsinmi?
            </p>
            <div className='mt-5 flex gap-2'>
              <button onClick={() => setDeleteCat(null)} className='flex-1 rounded-full border border-[var(--admin-border)] bg-transparent py-2 text-sm shadow-none outline-none transition-colors hover:bg-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'>Bekor</button>
              <button
                onClick={() => deleteMut.mutate(deleteCat.id)}
                disabled={deleteMut.isPending}
                className='flex-1 rounded-full bg-rose-500 py-2 text-sm font-semibold text-white shadow-none outline-none transition-colors hover:bg-rose-500 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50'
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
