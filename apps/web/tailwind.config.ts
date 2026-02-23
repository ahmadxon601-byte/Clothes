import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1ae550',
                tg: {
                    bg: 'var(--color-tg-bg)',
                    text: 'var(--color-tg-text)',
                    hint: 'var(--color-tg-hint)',
                    link: 'var(--color-tg-link)',
                    primary: 'var(--color-tg-primary)',
                    'primary-text': 'var(--color-tg-primary-text)',
                    'secondary-bg': 'var(--color-tg-secondary-bg)',
                },
            },
        },
    },
    plugins: [],
};
export default config;
