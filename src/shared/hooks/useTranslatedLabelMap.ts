'use client';

import { useEffect, useMemo, useState } from 'react';
import { translateText, type UiLanguage } from '../lib/translateClient';
import { detectSourceLanguage } from '../lib/webProductText';

type Item = {
  id: string;
  label: string;
};

export function useTranslatedLabelMap(items: Item[], language: UiLanguage) {
  const [translatedLabels, setTranslatedLabels] = useState<Record<string, string>>({});
  const stableItems = useMemo(
    () => items.map((item) => ({ id: item.id, label: item.label })),
    [JSON.stringify(items)]
  );
  const baseLabels = useMemo(
    () => Object.fromEntries(stableItems.map((item) => [item.id, item.label])),
    [stableItems]
  );
  const itemsKey = useMemo(
    () => stableItems.map((item) => `${item.id}:${item.label}`).join('|'),
    [stableItems]
  );

  useEffect(() => {
    let cancelled = false;

    if (language === 'uz' || stableItems.length === 0) {
      setTranslatedLabels((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    const run = async () => {
      const translated = await Promise.all(
        stableItems.map(async (item) => {
          try {
            return [item.id, await translateText(item.label, language, detectSourceLanguage(item.label))] as const;
          } catch {
            return [item.id, item.label] as const;
          }
        })
      );      

      if (!cancelled) {
        const next = Object.fromEntries(translated);
        setTranslatedLabels((prev) => {
          const prevKey = Object.entries(prev).map(([id, label]) => `${id}:${label}`).join('|');
          const nextKey = Object.entries(next).map(([id, label]) => `${id}:${label}`).join('|');
          return prevKey === nextKey ? prev : next;
        });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [itemsKey, language, stableItems]);

  return language === 'uz' ? baseLabels : { ...baseLabels, ...translatedLabels };
}
