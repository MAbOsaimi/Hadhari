import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'prefer-const': 'warn',
      'prefer-template': 'warn',
      'no-return-await': 'warn',
      complexity: ['warn', 12],
    },
  },
  pluginJs.configs.recommended,
  eslintConfigPrettier,
];
