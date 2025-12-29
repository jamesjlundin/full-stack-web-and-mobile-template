module.exports = {
  root: true,
  extends: ['../../packages/config/eslint.base.cjs'],
  ignorePatterns: [
    'node_modules',
    'android',
    'ios',
    'dist',
    'build',
    '__tests__/**/*',
  ],
};
