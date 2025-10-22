import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/build/**',
      '**/*.d.ts',
      '**/coverage/**',
      '**/*.min.js',
      '**/*.test.js',
      '**/*.test.ts',
      '**/__tests__/**',
      '**/public/**',
      '**/tests/**',
      '**/*.js', // ignore built JS files
      '**/.next/**',
      '**/.vite/**',
      '**/.storybook/**',
      '**/.cache/**',
      '**/.github/**',
      '**/.husky/**',
      '**/.vscode/**',
      '**/.pnpm-store/**',
      '**/.yarn/**',
      '**/.tmp/**',
      '**/*.log',
      '**/.env',
      '**/.git/**',
      '**/.idea/**',
      '**/.DS_Store',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    rules: {
      // Add your custom rules here
    },
  },
];
