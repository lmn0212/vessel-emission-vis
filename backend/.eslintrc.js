/* eslint-env node */
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 2021,
  },
  env: {
    node: true,
    es2021: true,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: [
    'dist/**',
    'prisma/**',
    '*.config.js',
    'jest.config.js',
    'node_modules/**'
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-undef': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'import/no-unresolved': 'off',
    'import/no-missing-import': 'off',
    'import/no-named-as-default': 'off',
    'import/extensions': 'off',
    'n/no-missing-import': 'off',
    'n/no-unresolved': 'off'
  }
};

// Top-level ignores for flat config
module.exports.ignores = [
  'dist/**',
  'prisma/**',
  '*.config.js',
  'jest.config.js',
  'node_modules/**'
]; 