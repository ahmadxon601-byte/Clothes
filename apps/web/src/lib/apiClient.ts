/**
 * Real backend API client.
 * Web app proxies /api/* → http://localhost:3001/api/*  (next.config.ts rewrites)
 * Response format: { success: true, data: ... } | { success: false, error: ... }
 */

const TOKEN_KEY = 'marketplace_token';

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getApiToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setApiToken(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
    }
}

function authHeaders(): Record<string, string> {
    const token = getApiToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`/api${path}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3010');
    if (params) {
        Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), { headers: authHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'API error');
    return json.data as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`/api${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'API error');
    return json.data as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiProduct {
    id: string;
    name: string;
    base_price: number;
    sku: string;
    views: number;
    created_at: string;
    category_id: string | null;
    category_name: string | null;
    store_id: string;
    store_name: string;
    thumbnail: string | null;
}

export interface ApiCategory {
    id: string;
    name: string;
    slug: string;
}

export interface ApiFavorite {
    id: string;
    product_id: string;
    created_at: string;
    title: string;
    base_price: number;
    image_url: string | null;
    brand: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function fetchProducts(params?: {
    category?: string;   // category UUID
    search?: string;
    sort?: 'newest' | 'popular';
    limit?: number;
    page?: number;
}): Promise<{ products: ApiProduct[]; pagination: Pagination }> {
    return apiGet('/products', {
        ...(params?.category ? { category: params.category } : {}),
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.sort ? { sort: params.sort } : {}),
        limit: String(params?.limit ?? 50),
        page: String(params?.page ?? 1),
    });
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<ApiCategory[]> {
    const data = await apiGet<{ categories: ApiCategory[] }>('/categories');
    return data.categories;
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export async function fetchFavorites(): Promise<ApiFavorite[]> {
    const token = getApiToken();
    if (!token) return [];
    return apiGet<ApiFavorite[]>('/favorites');
}

export async function toggleFavorite(productId: string): Promise<{ favorited: boolean }> {
    return apiPost('/favorites', { product_id: productId });
}

// ── Telegram WebApp auth ──────────────────────────────────────────────────────

export async function telegramWebAppAuth(initData: string): Promise<string> {
    const data = await apiPost<{ token: string; user: object }>('/auth/telegram-webapp', { initData });
    setApiToken(data.token);
    return data.token;
}
