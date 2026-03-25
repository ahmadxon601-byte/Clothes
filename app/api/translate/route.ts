import { NextRequest } from 'next/server';
import { ok, fail } from '@/src/lib/auth';

type SupportedLanguage = 'uz' | 'ru' | 'en';

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const to = normalizeLanguage(body?.to);
    const from = normalizeLanguage(body?.from);

    if (!text) return ok({ text: '' });
    if (to === from) return ok({ text });

    const cacheKey = `${from}:${to}:${text}`;
    const cached = getCachedTranslation(cacheKey);
    if (cached) return ok({ text: cached, cached: true });

    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`,
      { next: { revalidate: 60 * 60 } }
    );

    if (!response.ok) {
      return fail('Translate service unavailable', 502);
    }

    const payload = await response.json();
    const translated =
      typeof payload?.responseData?.translatedText === 'string'
        ? payload.responseData.translatedText
        : text;

    setCachedTranslation(cacheKey, translated);
    return ok({ text: translated });
  } catch (error) {
    console.error('[translate POST]', error);
    return fail('Translate request failed', 500);
  }
}
