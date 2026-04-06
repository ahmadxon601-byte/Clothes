export type QuickFilterMode = 'popular' | 'newest' | 'discount';
export type QuickFilterLocale = 'uz' | 'ru' | 'en';

export interface ProductQuickFilter {
  id: string;
  label: string;
  mode: QuickFilterMode;
  value?: number;
}

export const PRODUCT_QUICK_FILTERS_SETTING_KEY = 'products_quick_filters';

export function createDefaultProductQuickFilters(locale: QuickFilterLocale): ProductQuickFilter[] {
  const trendLabel = locale === 'ru' ? 'V trende' : locale === 'en' ? 'Trending' : 'Trendda';
  const newestLabel = locale === 'ru' ? 'Novinki' : locale === 'en' ? 'Newest' : 'Eng yangi';

  return [
    { id: 'popular', label: trendLabel, mode: 'popular' },
    { id: 'newest', label: newestLabel, mode: 'newest' },
    { id: 'discount-50', label: '50%', mode: 'discount', value: 50 },
    { id: 'discount-30', label: '30%', mode: 'discount', value: 30 },
    { id: 'discount-10', label: '10%', mode: 'discount', value: 10 },
  ];
}

export function parseProductQuickFilters(
  raw: string | null | undefined,
  fallback: ProductQuickFilter[]
): ProductQuickFilter[] {
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;

    const normalized = parsed
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;

        const mode = item.mode;
        if (mode !== 'popular' && mode !== 'newest' && mode !== 'discount') return null;

        const label = typeof item.label === 'string' ? item.label.trim() : '';
        if (!label) return null;

        const value =
          mode === 'discount' && Number.isFinite(Number(item.value))
            ? Number(item.value)
            : undefined;

        if (mode === 'discount' && (!value || value < 1 || value > 99)) return null;

        return {
          id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `${mode}-${value ?? index}`,
          label,
          mode,
          value,
        } satisfies ProductQuickFilter;
      })
      .filter((item): item is ProductQuickFilter => Boolean(item));

    return normalized.length > 0 ? normalized : fallback;
  } catch {
    return fallback;
  }
}
