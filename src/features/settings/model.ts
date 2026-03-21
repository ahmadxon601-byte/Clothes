import { create } from 'zustand';
import { mockApi } from '../../services/mockServer';
import type { Settings } from '../../shared/types';

interface SettingsState {
    settings: Settings;
    loadSettings: () => void;
    updateSettings: (s: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: { themeMode: 'auto', language: 'uz' },
    loadSettings: () => {
        set({ settings: mockApi.getSettings() });
    },
    updateSettings: (s: Partial<Settings>) => {
        mockApi.updateSettings(s);
        set((state) => ({ settings: { ...state.settings, ...s } }));
    }
}));
