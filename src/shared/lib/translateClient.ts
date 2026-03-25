'use client';

export type UiLanguage = 'uz' | 'ru' | 'en';

const translateCache = new Map<string, string>();

export async function translateText(text: string, to: UiLanguage, from: UiLanguage = 'uz') {
  const normalized = text.trim();
  if (!normalized || to === from) return text;

  const cacheKey = `${from}:${to}:${normalized}`;
  const cached = translateCache.get(cacheKey);
  if (cached) return cached;

  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: normalized, from, to }),
  });

  const payload = await response.json().catch(() => ({}));
  const translated =
    typeof payload?.data?.text === 'string'
      ? payload.data.text
      : typeof payload?.text === 'string'
        ? payload.text
        : text;

  translateCache.set(cacheKey, translated);
  return translated;
}

export async function translateHtmlToPlainText(html: string, to: UiLanguage, from: UiLanguage = 'uz') {
  if (!html || to === from) return html;

  if (typeof window === 'undefined') return html;

  const root = document.createElement('div');
  root.innerHTML = html;
  const plainText = root.textContent?.trim() ?? '';
  if (!plainText) return html;

  return translateText(plainText, to, from);
}
