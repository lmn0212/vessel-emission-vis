const globals = require('globals');
const tseslint = require('typescript-eslint');
const eslintPluginImport = require('eslint-plugin-import');
const eslintPluginN = require('eslint-plugin-n');
const eslintPluginPromise = require('eslint-plugin-promise');

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'import': eslintPluginImport,
      'n': eslintPluginN,
      'promise': eslintPluginPromise,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...eslintPluginImport.configs.recommended.rules,
      ...eslintPluginN.configs.recommended.rules,
      ...eslintPluginPromise.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-var-requires': 'off',
      'no-undef': 'off',
    },
  }
); 