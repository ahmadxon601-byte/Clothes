import { apiGet } from "@/src/lib/api";
import { mockCategories } from "@/src/data/mockCategories";
import { mockProducts } from "@/src/data/mockProducts";
import type { Category, Product } from "@/src/types/marketplace";

const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Product>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.price === "number" &&
    typeof candidate.image === "string"
  );
};

const isCategory = (value: unknown): value is Category => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Category>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.image === "string"
  );
};

const extractArray = <T>(
  payload: unknown,
  validator: (value: unknown) => value is T,
  keys: string[]
): T[] => {
  if (Array.isArray(payload)) {
    return payload.filter(validator);
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate.filter(validator);
    }
  }

  return [];
};

const extractSingleProduct = (payload: unknown): Product | null => {
  if (isProduct(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidate = record.product ?? record.data;
  return isProduct(candidate) ? candidate : null;
};

export async function listProducts(): Promise<Product[]> {
  try {
    const payload = await apiGet<unknown>("/api/products");
    const products = extractArray(payload, isProduct, ["products", "items", "data"]);
    if (products.length) {
      return products;
    }
  } catch {
    // Fallback to local mock when API does not exist.
  }

  return mockProducts;
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const payload = await apiGet<unknown>(`/api/products/${encodeURIComponent(id)}`);
    const product = extractSingleProduct(payload);
    if (product) {
      return product;
    }
  } catch {
    // Fallback to local data when API does not exist.
  }

  const products = await listProducts();
  return products.find((item) => item.id === id) ?? null;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const products = await listProducts();
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return products;
  }

  return products.filter((item) => {
    const haystack = `${item.name} ${item.description ?? ""} ${item.category ?? ""}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export async function listCategories(): Promise<Category[]> {
  try {
    const payload = await apiGet<unknown>("/api/categories");
    const categories = extractArray(payload, isCategory, ["categories", "items", "data"]);
    if (categories.length) {
      return categories;
    }
  } catch {
    // Fallback to local mock when API does not exist.
  }

  return mockCategories;
}
