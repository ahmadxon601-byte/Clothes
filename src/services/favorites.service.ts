import { listProducts } from "@/src/services/products.service";
import { readStorageJson, STORAGE_KEYS, writeStorageJson } from "@/src/lib/storage";
import type { Product } from "@/src/types/marketplace";

let memoryFavoriteIds: string[] = [];

const sanitizeIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

const readIds = (): string[] => {
  const stored = readStorageJson<unknown>(STORAGE_KEYS.favorites, memoryFavoriteIds);
  const ids = sanitizeIds(stored);
  memoryFavoriteIds = ids;
  return [...ids];
};

const writeIds = (ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids));
  memoryFavoriteIds = uniqueIds;
  writeStorageJson(STORAGE_KEYS.favorites, uniqueIds);
};

export const favoritesService = {
  listIds() {
    return readIds();
  },

  isFavorite(productId: string) {
    return readIds().includes(productId);
  },

  toggle(productId: string) {
    const ids = readIds();
    if (ids.includes(productId)) {
      const next = ids.filter((id) => id !== productId);
      writeIds(next);
      return next;
    }

    const next = [...ids, productId];
    writeIds(next);
    return next;
  },

  set(productId: string, favorite: boolean) {
    if (favorite) {
      const next = [...readIds(), productId];
      writeIds(next);
      return next;
    }

    const next = readIds().filter((id) => id !== productId);
    writeIds(next);
    return next;
  },

  async listProducts(): Promise<Product[]> {
    const ids = readIds();
    if (!ids.length) {
      return [];
    }

    const products = await listProducts();
    return products.filter((product) => ids.includes(product.id));
  }
};
