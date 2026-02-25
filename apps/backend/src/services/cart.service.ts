import { mockCartItems } from "@/src/services/mock-data";
import { readStorageJson, STORAGE_KEYS, writeStorageJson } from "@/src/lib/storage";
import type { CartItem, Product } from "@/src/types/marketplace";

type AddToCartInput = {
  size?: string;
  color?: string;
  quantity?: number;
};

let memoryCart: CartItem[] = mockCartItems.map((item) => ({ ...item }));

const cloneCart = (items: CartItem[]) => items.map((item) => ({ ...item }));

const sanitizeQuantity = (value: number) => {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
};

const sanitizeItem = (item: CartItem): CartItem => {
  return {
    id: item.id,
    name: item.name,
    image: item.image,
    size: item.size || "Uni",
    color: item.color || "Default",
    price: item.price,
    quantity: sanitizeQuantity(item.quantity)
  };
};

const readItems = (): CartItem[] => {
  const fallback = cloneCart(memoryCart);
  const stored = readStorageJson<CartItem[]>(STORAGE_KEYS.cart, fallback);
  if (!Array.isArray(stored)) {
    return fallback;
  }

  return stored.map(sanitizeItem);
};

const writeItems = (items: CartItem[]) => {
  const sanitized = items.map(sanitizeItem);
  memoryCart = cloneCart(sanitized);
  writeStorageJson(STORAGE_KEYS.cart, sanitized);
};

export const cartService = {
  list(): CartItem[] {
    return readItems();
  },

  addProduct(product: Product, input: AddToCartInput = {}): CartItem[] {
    const size = input.size || "Uni";
    const color = input.color || "Default";
    const quantity = sanitizeQuantity(input.quantity ?? 1);
    const items = readItems();

    const existingIndex = items.findIndex(
      (item) => item.id === product.id && item.size === size && item.color === color
    );

    if (existingIndex >= 0) {
      const current = items[existingIndex];
      items[existingIndex] = {
        ...current,
        quantity: sanitizeQuantity(current.quantity + quantity)
      };
      writeItems(items);
      return items;
    }

    items.push(
      sanitizeItem({
        id: product.id,
        name: product.name,
        image: product.image,
        size,
        color,
        price: product.price,
        quantity
      })
    );
    writeItems(items);
    return items;
  },

  remove(id: string) {
    const next = readItems().filter((item) => item.id !== id);
    writeItems(next);
    return next;
  },

  setQuantity(id: string, quantity: number) {
    const next = readItems().map((item) =>
      item.id === id ? { ...item, quantity: sanitizeQuantity(quantity) } : item
    );
    writeItems(next);
    return next;
  },

  clear() {
    writeItems([]);
    return [];
  },

  summary(items: CartItem[] = readItems()) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = items.length ? 15 : 0;
    const total = subtotal + shipping;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      shipping,
      total,
      totalItems
    };
  }
};
