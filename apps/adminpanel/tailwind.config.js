/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-main)',
        card: 'var(--bg-card)',
        pill: 'var(--bg-pill)',
        sidebar: 'var(--bg-card)',
        body: 'var(--bg-pill)',
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        border: 'var(--border-main)',
        'sidebar-text': 'var(--text-muted)',
        'sidebar-hover': 'var(--bg-pill)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
      },
      boxShadow: {
        premium: 'var(--shadow-premium)',
        'premium-hover': 'var(--shadow-premium-hover)',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
