export const APP_ROUTES = {
    HOME: '/',
    FAVORITES: '/favorites',
    PROFILE: '/profile',
    SEARCH: '/search',
    SETTINGS: '/settings',
    PRODUCT: (id: string) => `/p/${id}`,
    STORE: (id: string) => `/store/${id}`,
    STORE_APPLY: '/store/apply',
    STORE_STATUS: '/store/status',
} as const;
