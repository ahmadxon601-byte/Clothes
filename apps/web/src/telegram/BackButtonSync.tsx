'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

let WebApp: any;
if (typeof window !== 'undefined') {
    WebApp = require('@twa-dev/sdk').default;
}

export function BackButtonSync() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const isMainRoute = ['/', '/favorites', '/profile', '/settings'].includes(pathname);

            if (isMainRoute) {
                WebApp.BackButton.hide();
            } else {
                WebApp.BackButton.show();
            }

            const handleBack = () => {
                router.back();
            };

            WebApp.BackButton.onClick(handleBack);

            return () => {
                WebApp.BackButton.offClick(handleBack);
            };
        } catch (e) {
            console.warn('Back button sync error:', e);
        }
    }, [pathname, router]);

    return null;
}
