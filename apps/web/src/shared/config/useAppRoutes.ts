'use client';

import { usePathname } from 'next/navigation';
import { isTelegramRoute, SITE_ROUTES, TELEGRAM_ROUTES } from './constants';

export function useAppRoutes() {
    const pathname = usePathname();
    return isTelegramRoute(pathname) ? TELEGRAM_ROUTES : SITE_ROUTES;
}
