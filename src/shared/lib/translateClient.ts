'use client';

export type UiLanguage = 'uz' | 'ru' | 'en';

const translateCache = new Map<string, string>();
const batchCache = new Map<string, Record<string, string>>();

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

export async function translateTexts(
  items: Array<{ key: string; text: string; from?: UiLanguage }>,
  to: UiLanguage
) {
  const normalizedItems = items
    .map((item) => ({
      key: item.key,
      text: item.text.trim(),
      from: item.from ?? 'uz',
    }))
    .filter((item) => item.text);

  if (normalizedItems.length === 0) return {} as Record<string, string>;

  const unresolved = normalizedItems.filter((item) => {
    if (to === item.from) return false;
    return !translateCache.has(`${item.from}:${to}:${item.text}`);
  });

  const batchKey = `${to}|${unresolved.map((item) => `${item.key}:${item.from}:${item.text}`).join('|')}`;
  if (unresolved.length > 0 && batchCache.has(batchKey)) {
    const cachedBatch = batchCache.get(batchKey)!;
    Object.entries(cachedBatch).forEach(([cacheKey, value]) => {
      translateCache.set(cacheKey, value);
    });
  }

  const stillMissing = unresolved.filter(
    (item) => !translateCache.has(`${item.from}:${to}:${item.text}`)
  );

  if (stillMissing.length > 0) {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        items: stillMissing.map((item) => ({
          key: item.key,
          text: item.text,
          from: item.from,
        })),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    const result = payload?.data?.items ?? payload?.items ?? {};
    const batchResult: Record<string, string> = {};

    stillMissing.forEach((item) => {
      const translated =
        typeof result?.[item.key] === 'string' && result[item.key].trim()
          ? result[item.key]
          : item.text;
      const cacheKey = `${item.from}:${to}:${item.text}`;
      translateCache.set(cacheKey, translated);
      batchResult[cacheKey] = translated;
    });

    batchCache.set(batchKey, batchResult);
  }

  return Object.fromEntries(
    normalizedItems.map((item) => {
      const cacheKey = `${item.from}:${to}:${item.text}`;
      return [item.key, to === item.from ? item.text : translateCache.get(cacheKey) ?? item.text];
    })
  );
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
