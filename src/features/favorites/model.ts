import { create } from 'zustand';
import { mockApi } from '../../services/mockServer';

interface FavoritesState {
    favorites: string[];
    loadFavorites: () => Promise<void>;
    toggleFavorite: (productId: string) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
    favorites: [],
    loadFavorites: async () => {
        const prods = await mockApi.listFavorites();
        set({ favorites: prods.map(p => p.id) });
    },
    toggleFavorite: async (productId: string) => {
        // Optimistic UI update
        set((state) => ({
            favorites: state.favorites.includes(productId)
                ? state.favorites.filter(id => id !== productId)
                : [...state.favorites, productId]
        }));
        // Sync to store
        await mockApi.toggleFavorite(productId);
    }
}));
