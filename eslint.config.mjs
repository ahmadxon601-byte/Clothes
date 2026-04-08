import { FlatCompat } from '@eslint/eslintrc';
import nextVitals from 'eslint-config-next/core-web-vitals.js';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  {
    ignores: [
      '.next/**',
      '.next-dev/**',
      '.next-admin/**',
      'out/**',
      'dist/**',
      'build/**',
      'node_modules/**',
      'public/uploads/**',
      '.staged-images/**',
      '.vercel/**',
      '.local-postgres/**',
      'coverage/**',
    ],
  },
  ...compat.config(nextVitals),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
];

export default config;
