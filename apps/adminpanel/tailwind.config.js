/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: 'var(--bg-main)',
                card: 'var(--bg-card)',
                pill: 'var(--bg-pill)',
                main: 'var(--text-main)',
                muted: 'var(--text-muted)',
                border: 'var(--border-main)',
                accent: {
                    DEFAULT: 'var(--accent)',
                    hover: 'var(--accent-hover)',
                }
            },
            boxShadow: {
                premium: 'var(--shadow-premium)',
                'premium-hover': 'var(--shadow-premium-hover)',
            },
            borderRadius: {
                'xl': '16px',
                '2xl': '20px',
            }
        },
    },
    plugins: [],
}
