import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/node_modules', '**/dist', '**/.next', '**/next-env.d.ts', 'apps/mobile/__tests__/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      'unused-imports': eslintPluginUnusedImports,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
          extensionAlias: {
            '.js': ['.ts', '.tsx'],
          },
        },
      },
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintPluginImport.flatConfigs.recommended,
      eslintPluginImport.flatConfigs.typescript,
      eslintConfigPrettier,
    ],
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { args: 'after-used', argsIgnorePattern: '^_', vars: 'all', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['apps/mobile/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'import/default': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/no-unresolved': 'off',
    },
  }
);
