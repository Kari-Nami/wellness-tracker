import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'next-env.d.ts',
      'src/types/contracts.ts',
    ],
  },
  {
    files: ['deploy/mongo/*.js'],
    languageOptions: {
      globals: {
        rs: 'readonly',
        quit: 'readonly',
        db: 'readonly',
        process: 'readonly',
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
