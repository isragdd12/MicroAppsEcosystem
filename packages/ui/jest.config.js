/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  clearMocks: true,
  // react-native's own transformIgnorePatterns assumes a flat
  // node_modules/react-native/... path; pnpm nests real package
  // contents under node_modules/.pnpm/<pkg>/node_modules/<pkg>/..., so
  // the default regex fails to match and RN's Flow-typed internals never
  // get transformed. This override accounts for both layouts.
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?(?:@?react-native|@react-native(?:-community)?)[^/]*/)',
  ],
};
