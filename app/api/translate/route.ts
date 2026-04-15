import { NextRequest } from 'next/server';
import { ok, fail } from '@/src/lib/auth';

type SupportedLanguage = 'uz' | 'ru' | 'en';
type TranslationInput = {
  key: string;
  text: string;
  from?: SupportedLanguage;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const BATCH_LIMIT = 60;
const MAX_TEXT_LENGTH = 500;
const TRANSLATION_CONCURRENCY = 4;

declare global {
  // eslint-disable-next-line no-var
  var __translationCache:
    | Map<string, { value: string; expiresAt: number }>
    | undefined;
}

const translationCache =
  globalThis.__translationCache ?? (globalThis.__translationCache = new Map());

const normalizeLanguage = (value: unknown): SupportedLanguage => {
  return value === 'ru' || value === 'en' ? value : 'uz';
};

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.trim().slice(0, MAX_TEXT_LENGTH) : '';

const getCachedTranslation = (key: string) => {
  const entry = translationCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    translationCache.delete(key);
    return null;
  }
  return entry.value;
};

const setCachedTranslation = (key: string, value: string) => {
  translationCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

async function fetchTranslation(text: string, from: SupportedLanguage, to: SupportedLanguage) {
  if (!text || to === from) return text;

  const cacheKey = `${from}:${to}:${text}`;
  const cached = getCachedTranslation(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`,
    { next: { revalidate: 60 * 60 } }
  );

  if (!response.ok) {
    throw new Error('Translate service unavailable');
  }

  const payload = await response.json();
  const translated =
    typeof payload?.responseData?.translatedText === 'string'
      ? payload.responseData.translatedText
      : text;

  setCachedTranslation(cacheKey, translated);
  return translated;
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  });

  await Promise.all(runners);
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const to = normalizeLanguage(body?.to);
    const items: Array<{ key: string; text: string; from: SupportedLanguage }> | null = Array.isArray(body?.items)
      ? body.items
          .slice(0, BATCH_LIMIT)
          .map((item: unknown, index: number) => {
            const entry = item as Partial<TranslationInput> | null;
            return {
              key: typeof entry?.key === 'string' && entry.key.trim() ? entry.key.trim() : String(index),
              text: normalizeText(entry?.text),
              from: normalizeLanguage(entry?.from),
            };
          })
      : null;

    if (items) {
      const translatedEntries = await runWithConcurrency(items, TRANSLATION_CONCURRENCY, async (item) => {
        if (!item.text) return [item.key, ''] as const;
        try {
          return [item.key, await fetchTranslation(item.text, item.from, to)] as const;
        } catch {
          return [item.key, item.text] as const;
        }
      });

      return ok({
        items: Object.fromEntries(translatedEntries),
      });
    }

    const text = normalizeText(body?.text);
    const from = normalizeLanguage(body?.from);

    if (!text) return ok({ text: '' });

    try {
      return ok({ text: await fetchTranslation(text, from, to) });
    } catch {
      return fail('Translate service unavailable', 502);
    }
  } catch (error) {
    console.error('[translate POST]', error);
    return fail('Translate request failed', 500);
  }
}
