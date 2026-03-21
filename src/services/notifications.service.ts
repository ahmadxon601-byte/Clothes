import { apiGet } from "@/src/lib/api";
import { readStorageJson, STORAGE_KEYS, writeStorageJson } from "@/src/lib/storage";
import { mockNotifications } from "@/src/services/mock-data";
import type { MarketplaceNotification } from "@/src/types/marketplace";

let memoryNotifications: MarketplaceNotification[] = mockNotifications.map((item) => ({ ...item }));

const isNotification = (value: unknown): value is MarketplaceNotification => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<MarketplaceNotification>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.body === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.read === "boolean"
  );
};

const sanitizeNotifications = (value: unknown): MarketplaceNotification[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isNotification);
};

const cloneNotifications = (items: MarketplaceNotification[]) =>
  items.map((item) => ({ ...item }));

const readNotificationsFromStorage = () => {
  const stored = readStorageJson<unknown>(STORAGE_KEYS.notifications, memoryNotifications);
  const notifications = sanitizeNotifications(stored);
  memoryNotifications = cloneNotifications(notifications);
  return cloneNotifications(notifications);
};

const writeNotifications = (items: MarketplaceNotification[]) => {
  memoryNotifications = cloneNotifications(items);
  writeStorageJson(STORAGE_KEYS.notifications, items);
};

export const notificationsService = {
  async list(): Promise<MarketplaceNotification[]> {
    try {
      const payload = await apiGet<unknown>("/api/notifications");
      const direct = sanitizeNotifications(payload);
      if (direct.length) {
        writeNotifications(direct);
        return cloneNotifications(direct);
      }

      if (payload && typeof payload === "object") {
        const record = payload as Record<string, unknown>;
        const nested = sanitizeNotifications(record.notifications ?? record.items ?? record.data);
        if (nested.length) {
          writeNotifications(nested);
          return cloneNotifications(nested);
        }
      }
    } catch {
      // Use local fallback when API is unavailable.
    }

    return readNotificationsFromStorage();
  },

  markAllRead() {
    const next = readNotificationsFromStorage().map((item) => ({ ...item, read: true }));
    writeNotifications(next);
    return next;
  },

  markRead(id: string) {
    const next = readNotificationsFromStorage().map((item) =>
      item.id === id ? { ...item, read: true } : item
    );
    writeNotifications(next);
    return next;
  }
};
