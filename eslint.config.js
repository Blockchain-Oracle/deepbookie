import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/*.config.*',
      'apps/web/next-env.d.ts',
      'scripts/**', // throwaway/dev scripts (e.g. testnet de-risk)
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // no magic numbers / no console handled per-package; logging is via Pino (stderr for MCP)
      'no-console': 'warn',
      // hard per-file cap: 300 (CI fail). Soft target ~200 — flagged in review.
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // web app: React + hooks (the rest of the repo is non-React TS).
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // JSX render functions are legitimately long; the 300-line FILE cap still applies.
      'max-lines-per-function': 'off',
    },
  },
  {
    // tests may be longer and use console
    files: ['**/*.test.ts'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off', 'no-console': 'off' },
  },
);
