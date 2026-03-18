import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#13ec37',
                tg: {
                    bg: 'var(--color-tg-bg)',
                    text: 'var(--color-tg-text)',
                    hint: 'var(--color-tg-hint)',
                    primary: 'var(--color-tg-primary)',
                    'secondary-bg': 'var(--color-tg-secondary-bg)',
                },
            },
        },
    },
    plugins: [],
};

export default config;
