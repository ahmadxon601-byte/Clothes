const canUseStorage = () => {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
};

export const STORAGE_KEYS = {
  cart: ["clothes_cart_items", "cart_items", "cartItems", "basket_items", "basketItems", "basket", "cart"],
  favorites: ["clothes_favorite_ids", "favorites", "favorite_ids", "favoriteItems"],
  profile: ["clothes_profile", "profile", "user_profile"],
  settings: ["clothes_settings", "settings", "user_settings"],
  orders: ["clothes_orders", "orders", "order_history"],
  notifications: ["clothes_notifications", "notifications", "user_notifications"],
  sellerProducts: ["clothes_seller_products", "seller_products"],
  sellerPromotions: ["clothes_seller_promotions", "seller_promotions"],
  sellerSettings: ["clothes_seller_settings", "seller_settings"]
} as const;

const resolveStorageKey = (candidates: readonly string[]) => {
  if (!candidates.length) {
    throw new Error("Storage key candidates are required.");
  }

  if (!canUseStorage()) {
    return candidates[0];
  }

  const existingKey = candidates.find((key) => window.localStorage.getItem(key) !== null);
  return existingKey ?? candidates[0];
};

export const readStorageJson = <T>(candidates: readonly string[], fallbackValue: T): T => {
  if (!canUseStorage()) {
    return fallbackValue;
  }

  try {
    const key = resolveStorageKey(candidates);
    const value = window.localStorage.getItem(key);
    if (!value) {
      return fallbackValue;
    }

    return JSON.parse(value) as T;
  } catch {
    return fallbackValue;
  }
};

export const writeStorageJson = <T>(candidates: readonly string[], value: T) => {
  if (!canUseStorage()) {
    return;
  }

  const key = resolveStorageKey(candidates);
  window.localStorage.setItem(key, JSON.stringify(value));
};
