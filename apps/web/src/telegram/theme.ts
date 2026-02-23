let WebApp: any;
if (typeof window !== 'undefined') {
    WebApp = require('@twa-dev/sdk').default;
}

export function applyTelegramTheme() {
    if (typeof window === 'undefined') return;

    try {
        const lp = WebApp.themeParams;
        const root = document.documentElement;

        if (lp.bg_color) root.style.setProperty('--tg-theme-bg-color', lp.bg_color);
        if (lp.text_color) root.style.setProperty('--tg-theme-text-color', lp.text_color);
        if (lp.hint_color) root.style.setProperty('--tg-theme-hint-color', lp.hint_color);
        if (lp.link_color) root.style.setProperty('--tg-theme-link-color', lp.link_color);
        if (lp.button_color) root.style.setProperty('--tg-theme-button-color', lp.button_color);
        if (lp.button_text_color) root.style.setProperty('--tg-theme-button-text-color', lp.button_text_color);
        if (lp.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', lp.secondary_bg_color);
    } catch (e) {
        console.error('Failed to map Telegram themes', e);
    }
}
