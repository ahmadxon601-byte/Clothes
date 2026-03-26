'use client';

export const TELEGRAM_LOGOUT_KEY = 'tg_webapp_logged_out';

export function isTelegramLoggedOutByUser(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(TELEGRAM_LOGOUT_KEY) === '1';
}

export function markTelegramLoggedOut(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TELEGRAM_LOGOUT_KEY, '1');
}

export function clearTelegramLoggedOut(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TELEGRAM_LOGOUT_KEY);
}
