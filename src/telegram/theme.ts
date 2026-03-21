import { getTelegramWebApp } from './webApp';

type ThemeMode = 'auto' | 'light' | 'dark';

type ThemePalette = {
    bg: string;
    surface: string;
    surface2: string;
    text: string;
    muted: string;
    hint: string;
    border: string;
    navBg: string;
    navIcon: string;
    navBorder: string;
};

const PALETTE: Record<Exclude<ThemeMode, 'auto'>, ThemePalette> = {
    light: {
        bg: '#f8f8f8',
        surface: '#ffffff',
        surface2: '#f2f2f2',
        text: '#121417',
        muted: '#909499',
        hint: '#909499',
        border: 'rgba(0, 0, 0, 0.05)',
        navBg: 'rgba(255, 255, 255, 0.85)',
        navIcon: '#909499',
        navBorder: 'rgba(0, 0, 0, 0.08)',
    },
    dark: {
        bg: '#0a0a0a',
        surface: '#1a1a1c',
        surface2: '#242426',
        text: '#ffffff',
        muted: '#a0a0a2',
        hint: '#606062',
        border: 'rgba(255, 255, 255, 0.1)',
        navBg: '#1a1a1c',
        navIcon: '#a0a0a2',
        navBorder: 'rgba(255, 255, 255, 0.1)',
    },
};

function applyPalette(palette: ThemePalette) {
    const root = document.documentElement;

    root.style.setProperty('--color-bg', palette.bg);
    root.style.setProperty('--color-surface', palette.surface);
    root.style.setProperty('--color-surface2', palette.surface2);
    root.style.setProperty('--color-text', palette.text);
    root.style.setProperty('--color-muted', palette.muted);
    root.style.setProperty('--color-hint', palette.hint);
    root.style.setProperty('--color-border', palette.border);
    root.style.setProperty('--color-nav-bg', palette.navBg);
    root.style.setProperty('--color-nav-icon', palette.navIcon);
    root.style.setProperty('--color-nav-border', palette.navBorder);

    // Legacy aliases still used by some parts
    root.style.setProperty('--color-tg-bg', palette.bg);
    root.style.setProperty('--color-tg-text', palette.text);
    root.style.setProperty('--color-tg-hint', palette.hint);
    root.style.setProperty('--color-tg-secondary-bg', palette.surface);
}

function resolveAutoPalette(): ThemePalette {
    const webApp = getTelegramWebApp();
    const lp = webApp?.themeParams ?? {};
    const isDark = webApp?.colorScheme === 'dark' || (!webApp && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const fallback = isDark ? PALETTE.dark : PALETTE.light;

    return {
        bg: lp.bg_color || fallback.bg,
        surface: lp.secondary_bg_color || fallback.surface,
        surface2: fallback.surface2,
        text: lp.text_color || fallback.text,
        muted: fallback.muted,
        hint: lp.hint_color || fallback.hint,
        border: fallback.border,
        navBg: lp.secondary_bg_color || fallback.navBg,
        navIcon: fallback.navIcon,
        navBorder: fallback.navBorder,
    };
}

export function applyTelegramTheme(mode: ThemeMode = 'auto') {
    if (typeof window === 'undefined') return;

    try {
        const root = document.documentElement;

        if (mode === 'auto') {
            const autoPalette = resolveAutoPalette();
            applyPalette(autoPalette);
            const webApp = getTelegramWebApp();
            const isDark = webApp?.colorScheme === 'dark' || (!webApp && window.matchMedia('(prefers-color-scheme: dark)').matches);
            root.classList.toggle('dark', isDark);
            return;
        }

        applyPalette(PALETTE[mode]);
        root.classList.toggle('dark', mode === 'dark');
    } catch (e) {
        console.error('Failed to map Telegram themes', e);
    }
}
