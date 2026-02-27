import type { Product, Store, Comment, StoreApplication, Settings } from '../shared/types';
import { initialProducts, initialStores } from './seed';

const STORAGE_KEYS = {
    PRODUCTS: 'app_products',
    STORES: 'app_stores',
    COMMENTS: 'app_comments',
    FAVORITES: 'app_favorites',
    APPLICATIONS: 'app_applications',
    SETTINGS: 'app_settings',
};

const parseArray = <T>(value: string | null): T[] => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value) as unknown;
        return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
        return [];
    }
};

const mergeById = <T extends { id: string }>(current: T[], seed: T[]): T[] => {
    if (!current.length) return seed;
    const seen = new Set(current.map((item) => item.id));
    const missing = seed.filter((item) => !seen.has(item.id));
    return missing.length ? [...current, ...missing] : current;
};

// Initialize seed data
const initData = () => {
    if (typeof window === 'undefined') return;
    const storedProducts = parseArray<Product>(localStorage.getItem(STORAGE_KEYS.PRODUCTS));
    const storedStores = parseArray<Store>(localStorage.getItem(STORAGE_KEYS.STORES));

    localStorage.setItem(
        STORAGE_KEYS.PRODUCTS,
        JSON.stringify(mergeById(storedProducts, initialProducts)),
    );
    localStorage.setItem(
        STORAGE_KEYS.STORES,
        JSON.stringify(mergeById(storedStores, initialStores)),
    );

    if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
        localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ themeMode: 'auto', language: 'uz' }));
    }
};

const getFromStorage = <T>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    initData();
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

const saveToStorage = <T>(key: string, data: T) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
};

export const mockApi = {
    // Stores list
    async listStores(): Promise<Store[]> {
        return new Promise(resolve => setTimeout(() => {
            const stores = getFromStorage<Store>(STORAGE_KEYS.STORES);
            resolve(stores.filter(s => s.status === 'ACTIVE'));
        }, 250));
    },

    // Products
    async listProducts(params?: { q?: string; category?: string }): Promise<Product[]> {
        return new Promise(resolve => setTimeout(() => {
            let products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
            if (params?.q) {
                products = products.filter(p => p.title.toLowerCase().includes(params.q!.toLowerCase()));
            }
            if (params?.category) {
                products = products.filter(p => p.category === params.category);
            }
            resolve(products);
        }, 400));
    },

    async getProduct(id: string): Promise<Product | undefined> {
        return new Promise(resolve => setTimeout(() => {
            const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
            resolve(products.find(p => p.id === id));
        }, 200));
    },

    // Stores
    async getStore(id: string): Promise<Store | undefined> {
        return new Promise(resolve => setTimeout(() => {
            const stores = getFromStorage<Store>(STORAGE_KEYS.STORES);
            resolve(stores.find(s => s.id === id));
        }, 200));
    },

    async listStoreProducts(storeId: string): Promise<Product[]> {
        return new Promise(resolve => setTimeout(() => {
            const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
            resolve(products.filter(p => p.storeId === storeId));
        }, 300));
    },

    // Comments
    async listComments(productId: string): Promise<Comment[]> {
        return new Promise(resolve => setTimeout(() => {
            const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS);
            resolve(comments.filter(c => c.productId === productId));
        }, 200));
    },

    async addComment(productId: string, userId: string, text: string): Promise<Comment> {
        return new Promise(resolve => setTimeout(() => {
            const comments = getFromStorage<Comment>(STORAGE_KEYS.COMMENTS);
            const newComment: Comment = {
                id: Math.random().toString(36).substr(2, 9),
                productId,
                userId,
                text,
                createdAt: new Date().toISOString(),
            };
            saveToStorage(STORAGE_KEYS.COMMENTS, [...comments, newComment]);
            resolve(newComment);
        }, 500));
    },

    // Favorites
    async listFavorites(): Promise<Product[]> {
        return new Promise(resolve => setTimeout(() => {
            const favIds = getFromStorage<string>(STORAGE_KEYS.FAVORITES);
            const products = getFromStorage<Product>(STORAGE_KEYS.PRODUCTS);
            resolve(products.filter(p => favIds.includes(p.id)));
        }, 200));
    },

    async toggleFavorite(productId: string): Promise<boolean> {
        return new Promise(resolve => setTimeout(() => {
            let favIds = getFromStorage<string>(STORAGE_KEYS.FAVORITES);
            const isFav = favIds.includes(productId);
            if (isFav) {
                favIds = favIds.filter(id => id !== productId);
            } else {
                favIds.push(productId);
            }
            saveToStorage(STORAGE_KEYS.FAVORITES, favIds);
            resolve(!isFav); // return new status
        }, 100)); // optimistic response usually faster
    },

    // Store Application
    async submitStoreApplication(userId: string, formData: Omit<StoreApplication, 'id' | 'userId' | 'status'>): Promise<StoreApplication> {
        return new Promise(resolve => setTimeout(() => {
            const apps = getFromStorage<StoreApplication>(STORAGE_KEYS.APPLICATIONS);
            const newApp: StoreApplication = {
                id: Math.random().toString(36).substr(2, 9),
                userId,
                ...formData,
                status: 'PENDING'
            };

            const existingKey = apps.findIndex(a => a.userId === userId);
            if (existingKey >= 0) {
                apps[existingKey] = newApp; // Overwrite if resubmitting
            } else {
                apps.push(newApp);
            }

            saveToStorage(STORAGE_KEYS.APPLICATIONS, apps);
            resolve(newApp);
        }, 800));
    },

    async getMyApplication(userId: string): Promise<StoreApplication | undefined> {
        return new Promise(resolve => setTimeout(() => {
            const apps = getFromStorage<StoreApplication>(STORAGE_KEYS.APPLICATIONS);
            resolve(apps.find(a => a.userId === userId));
        }, 200));
    },

    // Settings
    getSettings(): Settings {
        if (typeof window === 'undefined') return { themeMode: 'auto', language: 'uz' };
        const st = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return st ? JSON.parse(st) : { themeMode: 'auto', language: 'uz' };
    },

    updateSettings(settings: Partial<Settings>) {
        const current = this.getSettings();
        saveToStorage(STORAGE_KEYS.SETTINGS, { ...current, ...settings });
    },

    resetAllData() {
        if (typeof window === 'undefined') return;
        localStorage.clear();
        initData();
    }
};
