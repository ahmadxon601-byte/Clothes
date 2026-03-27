import type { UiLanguage } from './translateClient';
import { repairText } from './repairText';

export function detectSourceLanguage(text: string): UiLanguage {
  if (/[А-Яа-яЁё]/.test(text)) return 'ru';
  if (/[A-Za-z]/.test(text)) return 'uz';
  return 'uz';
}

export function looksLikeBrokenName(text: string) {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return true;
  if (/^[a-z]{6,}$/.test(normalized) && !/[aeiou]/.test(normalized)) return true;
  if (/^(.)\1{3,}$/.test(normalized)) return true;
  return false;
}

export function getGenericProductLabel(language: UiLanguage) {
  return language === 'ru' ? 'Товар' : language === 'en' ? 'Product' : 'Mahsulot';
}

export function sanitizeProductLabel(label: string, language: UiLanguage) {
  const repaired = repairText(label || '');
  return looksLikeBrokenName(repaired) ? getGenericProductLabel(language) : repaired;
}
