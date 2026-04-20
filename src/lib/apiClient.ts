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

export function clearApiToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
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
    sale_price: number | null;
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
    name_uz: string | null;
    name_ru: string | null;
    name_en: string | null;
    slug: string;
    sticker?: string | null;
    parent_id?: string | null;
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

// ── Extended product type (detail page) ───────────────────────────────────────

export interface ApiProductDetail extends ApiProduct {
    description: string | null;
    category_slug: string | null;
    effective_sale_price?: number | null;
    images: { id: string; url: string; sort_order: number }[];
    variants: { id: string; size: string | null; color: string | null; price: number; stock: number; sku: string }[];
    location: { latitude: number; longitude: number; address: string } | null;
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function fetchProductById(id: string): Promise<ApiProductDetail> {
    const data = await apiGet<{ product: ApiProductDetail }>(`/products/${id}`);
    return data.product;
}

export async function fetchProducts(params?: {
    category?: string;
    search?: string;
    sort?: 'newest' | 'oldest' | 'popular' | 'price_asc' | 'price_desc';
    limit?: number;
    page?: number;
    min_price?: number;
    max_price?: number;
    on_sale?: boolean;
    min_discount?: number;
    exact_discount?: number;
    size?: string;
    created_from?: string;
    created_to?: string;
}): Promise<{ products: ApiProduct[]; pagination: Pagination }> {
    const p: Record<string, string> = {
        limit: String(params?.limit ?? 50),
        page: String(params?.page ?? 1),
    };
    if (params?.category) p.category = params.category;
    if (params?.search) p.search = params.search;
    if (params?.sort) p.sort = params.sort;
    if (params?.min_price != null) p.min_price = String(params.min_price);
    if (params?.max_price != null) p.max_price = String(params.max_price);
    if (params?.on_sale) p.on_sale = '1';
    if (params?.min_discount != null) p.min_discount = String(params.min_discount);
    if (params?.exact_discount != null) p.exact_discount = String(params.exact_discount);
    if (params?.size) p.size = params.size;
    if (params?.created_from) p.created_from = params.created_from;
    if (params?.created_to) p.created_to = params.created_to;
    return apiGet('/products', p);
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
