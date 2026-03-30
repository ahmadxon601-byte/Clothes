export interface TelegramWebApp {
    ready?: () => void;
    expand?: () => void;
    requestFullscreen?: () => void;
    isFullscreen?: boolean;
    colorScheme?: 'light' | 'dark';
    themeParams?: {
        bg_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
        secondary_bg_color?: string;
        header_bg_color?: string;
        accent_text_color?: string;
        section_bg_color?: string;
        section_header_text_color?: string;
        subtitle_text_color?: string;
        destructive_text_color?: string;
    };
    initData?: string;
    initDataUnsafe?: {
        user?: {
            id?: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
        };
    };
    onEvent?: (eventType: string, eventHandler: () => void) => void;
    offEvent?: (eventType: string, eventHandler: () => void) => void;
    BackButton?: {
        show?: () => void;
        hide?: () => void;
        onClick?: (cb: () => void) => void;
        offClick?: (cb: () => void) => void;
    };
}

declare global {
    interface Window {
        Telegram?: {
            WebApp?: TelegramWebApp;
        };
    }
}

export function getTelegramWebApp(): TelegramWebApp | null {
    if (typeof window === 'undefined') return null;
    return window.Telegram?.WebApp ?? null;
}

export function safeTelegramCall<T>(
    label: string,
    fn: () => T,
    fallback?: T,
): T | undefined {
    try {
        return fn();
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[Telegram SDK] ${label} failed`, e);
        }
        return fallback;
    }
}
