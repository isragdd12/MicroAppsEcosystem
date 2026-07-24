// @ts-check

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./eslint.base.js')],
  rules: {
    // A feature may be reached by route (Expo Router), not by importing
    // another feature's internals directly — see NAVIGATION.md's
    // cross-feature navigation rule and REPOSITORY_STRUCTURE.md's
    // feature-isolation rationale.
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@microapps/*/src/*', '@microapps/*/dist/*'],
            message:
              "Import from a package's public entrypoint (e.g. '@microapps/ui'), not its internals.",
          },
          {
            group: ['*/features/*/features/*'],
            message:
              "Features may not import another feature's internals directly. Navigate by route instead, or promote shared logic to apps/<app>/components|utils or a package.",
          },
        ],
      },
    ],
  },
};
