// @ts-check

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: false,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'eslint-config-prettier',
  ],
  env: {
    es2022: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
      },
    ],
    // Enforce the "packages are internal SDKs" rule from
    // REPOSITORY_STRUCTURE.md / UI_SYSTEM.md: consumers of a shared
    // package may only import its public entrypoint, never reach into
    // internal modules.
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@microapps/*/src/*', '@microapps/*/dist/*'],
            message:
              "Import from a package's public entrypoint (e.g. '@microapps/ui'), not its internals.",
          },
        ],
      },
    ],
  },
};
