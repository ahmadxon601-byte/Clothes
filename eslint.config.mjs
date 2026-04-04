import { FlatCompat } from '@eslint/eslintrc';
import nextVitals from 'eslint-config-next/core-web-vitals.js';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/uploads/**',
      '.staged-images/**',
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
