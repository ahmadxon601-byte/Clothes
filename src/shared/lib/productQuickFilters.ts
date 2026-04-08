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

    const normalized: Array<ProductQuickFilter | null> = parsed
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const candidate = item as Record<string, unknown>;

        const mode = candidate.mode;
        if (mode !== 'popular' && mode !== 'newest' && mode !== 'discount') return null;

        const label = typeof candidate.label === 'string' ? candidate.label.trim() : '';
        if (!label) return null;

        const value =
          mode === 'discount' && Number.isFinite(Number(candidate.value))
            ? Number(candidate.value)
            : undefined;

        if (mode === 'discount' && (!value || value < 1 || value > 99)) return null;

        if (mode === 'discount') {
          return {
            id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : `${mode}-${value}`,
            label,
            mode,
            value,
          };
        }

        return {
          id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : `${mode}-${index}`,
          label,
          mode,
        };
      });

    const filtered = normalized.filter((item): item is ProductQuickFilter => item !== null);
    return filtered.length > 0 ? filtered : fallback;
  } catch {
    return fallback;
  }
}
