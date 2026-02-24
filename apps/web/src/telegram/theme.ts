let WebApp: any;
if (typeof window !== 'undefined') {
    WebApp = require('@twa-dev/sdk').default;
}

export function applyTelegramTheme() {
    if (typeof window === 'undefined') return;

    try {
        const lp = WebApp.themeParams;
        const root = document.documentElement;

        const setVar = (name: string, value: string | undefined) => {
            if (value) root.style.setProperty(name, value);
        };

        setVar('--tg-theme-bg-color', lp.bg_color);
        setVar('--tg-theme-text-color', lp.text_color);
        setVar('--tg-theme-hint-color', lp.hint_color);
        setVar('--tg-theme-link-color', lp.link_color);
        setVar('--tg-theme-button-color', lp.button_color);
        setVar('--tg-theme-button-text-color', lp.button_text_color);
        setVar('--tg-theme-secondary-bg-color', lp.secondary_bg_color);

        // Qo'shimcha o'zgaruvchilar
        setVar('--tg-theme-header-bg-color', lp.header_bg_color);
        setVar('--tg-theme-accent-text-color', lp.accent_text_color);
        setVar('--tg-theme-section-bg-color', lp.section_bg_color);
        setVar('--tg-theme-section-header-text-color', lp.section_header_text_color);
        setVar('--tg-theme-subtitle-text-color', lp.subtitle_text_color);
        setVar('--tg-theme-destructive-text-color', lp.destructive_text_color);

        // Dark mode klassini sinxronlash
        if (WebApp.colorScheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    } catch (e) {
        console.error('Failed to map Telegram themes', e);
    }
}
