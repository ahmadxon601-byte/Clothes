import { apiGet, apiPost } from "@/src/lib/api";
import { readStorageJson, STORAGE_KEYS, writeStorageJson } from "@/src/lib/storage";
import { mockUserProfile, mockUserSettings } from "@/src/services/mock-data";
import type { UserProfile, UserSettings } from "@/src/types/marketplace";

let memoryProfile: UserProfile = { ...mockUserProfile };
let memorySettings: UserSettings = { ...mockUserSettings };

const sanitizeProfile = (value: unknown): UserProfile => {
  if (!value || typeof value !== "object") {
    return { ...mockUserProfile };
  }

  const profile = value as Partial<UserProfile>;
  return {
    fullName: typeof profile.fullName === "string" ? profile.fullName : mockUserProfile.fullName,
    phone: typeof profile.phone === "string" ? profile.phone : mockUserProfile.phone,
    email: typeof profile.email === "string" ? profile.email : mockUserProfile.email
  };
};

const sanitizeSettings = (value: unknown): UserSettings => {
  if (!value || typeof value !== "object") {
    return { ...mockUserSettings };
  }

  const settings = value as Partial<UserSettings>;
  return {
    language: settings.language === "uz" ? "uz" : "en",
    marketingEmails:
      typeof settings.marketingEmails === "boolean"
        ? settings.marketingEmails
        : mockUserSettings.marketingEmails,
    orderUpdates:
      typeof settings.orderUpdates === "boolean"
        ? settings.orderUpdates
        : mockUserSettings.orderUpdates
  };
};

const readProfileFromStorage = () => {
  const stored = readStorageJson<unknown>(STORAGE_KEYS.profile, memoryProfile);
  const profile = sanitizeProfile(stored);
  memoryProfile = profile;
  return profile;
};

const readSettingsFromStorage = () => {
  const stored = readStorageJson<unknown>(STORAGE_KEYS.settings, memorySettings);
  const settings = sanitizeSettings(stored);
  memorySettings = settings;
  return settings;
};

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    try {
      const profile = sanitizeProfile(await apiGet<unknown>("/api/profile"));
      memoryProfile = profile;
      writeStorageJson(STORAGE_KEYS.profile, profile);
      return profile;
    } catch {
      return readProfileFromStorage();
    }
  },

  async saveProfile(nextProfile: UserProfile): Promise<UserProfile> {
    const profile = sanitizeProfile(nextProfile);
    memoryProfile = profile;
    writeStorageJson(STORAGE_KEYS.profile, profile);

    try {
      await apiPost<unknown, UserProfile>("/api/profile", profile);
    } catch {
      // Keep local state as fallback when API is unavailable.
    }

    return profile;
  },

  async getSettings(): Promise<UserSettings> {
    try {
      const settings = sanitizeSettings(await apiGet<unknown>("/api/settings"));
      memorySettings = settings;
      writeStorageJson(STORAGE_KEYS.settings, settings);
      return settings;
    } catch {
      return readSettingsFromStorage();
    }
  },

  async saveSettings(nextSettings: UserSettings): Promise<UserSettings> {
    const settings = sanitizeSettings(nextSettings);
    memorySettings = settings;
    writeStorageJson(STORAGE_KEYS.settings, settings);

    try {
      await apiPost<unknown, UserSettings>("/api/settings", settings);
    } catch {
      // Keep local state as fallback when API is unavailable.
    }

    return settings;
  }
};
