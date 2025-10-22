import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // 1. Global Ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/public/**',
      '**/.turbo/**',
      '**/.cache/**',
      '**/*.log',
      '**/.env',
      '**/*.config.js',
      '**/*.setup.js',
      'scripts/**',
      '**/*.d.ts',
      'ts-jest[ts-compiler]**',
      '**/*.md',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  // 3. All TS/TSX files (general rules, warn)
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-empty': 'warn',
      'no-control-regex': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-var-requires': 'error',
    },
  },
  // 4. Browser environment (web, vendor, ui)
  {
    files: [
      'apps/web/**/*.ts',
      'apps/web/**/*.tsx',
      'apps/vendor/**/*.ts',
      'apps/vendor/**/*.tsx',
      'packages/ui/src/**/*.ts',
      'packages/ui/src/**/*.tsx',
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
    },
  },
  // 5. Node.js environment (api)
  {
    files: ['apps/api/src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  // 6. Agnostic libraries (lib, types)
  {
    files: ['packages/lib/src/**/*.ts', 'packages/lib/src/**/*.tsx', 'packages/types/src/**/*.ts'],
    // No specific environment globals, inherits warn rules
  },
  // 7. Node.js scripts and config (rules off)
  {
    files: [
      'scripts/**/*.js',
      '*.config.js',
      'packages/**/jest.config.js',
      'packages/**/jest.setup.js',
      'apps/**/jest.config.js',
      'apps/**/jest.setup.js',
      'apps/**/next.config.js',
      'playwright.config.ts',
    ],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-empty': 'off',
      'no-control-regex': 'off',
      'no-undef': 'warn',
    },
  },
  // 8. Test files (rules off)
  {
    files: [
      'apps/*/tests/**/*',
      'packages/*/tests/**/*',
      'apps/*/__tests__/**/*',
      'packages/*/__tests__/**/*',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.test.tsx',
      '**/*.spec.tsx',
    ],
    languageOptions: {
      globals: { ...globals.jest, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-empty': 'off',
      'no-control-regex': 'off',
      'no-undef': 'off',
    },
  },
];
