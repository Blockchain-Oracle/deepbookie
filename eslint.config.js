import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/*.config.*',
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
    // tests may be longer and use console
    files: ['**/*.test.ts'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off', 'no-console': 'off' },
  },
);
