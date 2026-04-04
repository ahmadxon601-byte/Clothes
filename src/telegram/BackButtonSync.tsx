'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getTelegramWebApp, safeTelegramCall } from './webApp';

export function BackButtonSync() {
    const router = useRouter();
    const pathname = usePathname();
    const currentPath = pathname ?? '/';

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const webApp = getTelegramWebApp();
            const backButton = webApp?.BackButton;
            if (!backButton) return;

            const isMainRoute = ['/', '/favorites', '/profile', '/settings'].includes(currentPath);

            if (isMainRoute) {
                safeTelegramCall('BackButton.hide', () => backButton.hide?.());
            } else {
                safeTelegramCall('BackButton.show', () => backButton.show?.());
            }

            const handleBack = () => {
                router.back();
            };

            safeTelegramCall('BackButton.onClick', () => backButton.onClick?.(handleBack));

            return () => {
                safeTelegramCall('BackButton.offClick', () => backButton.offClick?.(handleBack));
            };
        } catch (e) {
            console.warn('Back button sync error:', e);
        }
    }, [currentPath, router]);

    return null;
}
