'use client';

import { useEffect, useMemo, useState } from 'react';
import { translateTexts, type UiLanguage } from '../lib/translateClient';
import { detectSourceLanguage } from '../lib/webProductText';

type Item = {
  id: string;
  label: string;
};

export function useTranslatedLabelMap(items: Item[], language: UiLanguage) {
  const [translatedLabels, setTranslatedLabels] = useState<Record<string, string>>({});
  const itemsKey = items.map((item) => `${item.id}:${item.label}`).join('|');
  const stableItems = useMemo(
    () => items.map((item) => ({ id: item.id, label: item.label })),
    [items]
  );
  const baseLabels = useMemo(
    () => Object.fromEntries(stableItems.map((item) => [item.id, item.label])),
    [stableItems]
  );

  useEffect(() => {
    let cancelled = false;

    if (language === 'uz' || stableItems.length === 0) {
      setTranslatedLabels((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    const run = async () => {
      const uniqueItems = Array.from(
        new Map(
          stableItems.map((item) => [`${detectSourceLanguage(item.label)}:${item.label}`, item])
        ).values()
      );
      const uniqueItemsByLabel = new Map(uniqueItems.map((item) => [item.label, item]));

      let translatedById: Record<string, string>;
      try {
        translatedById = await translateTexts(
          uniqueItems.map((item) => ({
            key: item.id,
            text: item.label,
            from: detectSourceLanguage(item.label),
          })),
          language
        );
      } catch {
        translatedById = Object.fromEntries(uniqueItems.map((item) => [item.id, item.label]));
      }

      if (!cancelled) {
        const next = Object.fromEntries(
          stableItems.map((item) => {
            const match = uniqueItemsByLabel.get(item.label);
            return [item.id, match ? translatedById[match.id] ?? item.label : item.label];
          })
        );
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
