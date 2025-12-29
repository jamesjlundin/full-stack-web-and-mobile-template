module.exports = {
  // Use react-native preset for mocks
  preset: 'react-native',
  // Pattern for pnpm monorepo structure
  transformIgnorePatterns: [
    '/node_modules/.pnpm/(?!((jest-)?react-native|@react-native(-community)?|@testing-library|invariant|react-clone-referenced-element|@react-native/js-polyfills))',
  ],
  // Override setup to use custom CommonJS file
  setupFiles: [require.resolve('./jest.setup.js')],
};
