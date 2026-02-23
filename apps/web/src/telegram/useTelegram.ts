'use client';
import { useEffect, useState } from 'react';

let WebApp: any;
if (typeof window !== 'undefined') {
    WebApp = require('@twa-dev/sdk').default;
}

export function useTelegram() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                WebApp.ready();
                WebApp.expand();
                setIsReady(true);
            } catch (err) {
                console.warn('Telegram SDK not initialized. Local browser mode?', err);
            }
        }
    }, []);

    return {
        WebApp: typeof window !== 'undefined' ? WebApp : null,
        user: typeof window !== 'undefined' ? WebApp.initDataUnsafe?.user : null,
        isReady,
    };
}
