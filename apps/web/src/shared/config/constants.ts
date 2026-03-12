const TELEGRAM_BASE = '/telegram';

const buildRoutes = (base: string) => {
    const withBase = (path: string) => {
        if (!base) return path;
        if (path === '/') return base;
        return `${base}${path}`;
    };

    return {
        HOME: withBase('/'),
        STORES: withBase('/stores'),
        PRODUCTS: withBase('/products'),
        FAVORITES: withBase('/favorites'),
        PROFILE: withBase('/profile'),
        SEARCH: withBase('/search'),
        SETTINGS: withBase('/settings'),
        PRODUCT: (id: string) => withBase(`/product/${id}`),
        STORE: (id: string) => withBase(`/store/${id}`),
        STORE_APPLY: withBase('/store/apply'),
        STORE_STATUS: withBase('/store/status'),
    } as const;
};

export const SITE_ROUTES = buildRoutes('');
export const TELEGRAM_ROUTES = buildRoutes(TELEGRAM_BASE);
export const APP_ROUTES = TELEGRAM_ROUTES;

export const isTelegramRoute = (pathname: string | null | undefined) =>
    Boolean(pathname && (pathname === TELEGRAM_BASE || pathname.startsWith(`${TELEGRAM_BASE}/`)));
