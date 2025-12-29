/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// Get the monorepo root
const monorepoRoot = path.resolve(__dirname, '../..');

/**
 * Find actual module path in pnpm's node_modules structure
 * pnpm uses symlinks and .pnpm directory, so we need to resolve properly
 */
function getModulePath(moduleName) {
  const possiblePaths = [
    // Direct in local node_modules
    path.join(__dirname, 'node_modules', moduleName),
    // Direct in root node_modules
    path.join(monorepoRoot, 'node_modules', moduleName),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      // Resolve symlink to get actual path
      return fs.realpathSync(p);
    }
  }

  // Fallback to root node_modules
  return path.join(monorepoRoot, 'node_modules', moduleName);
}

/**
 * Metro configuration for pnpm monorepo
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // Watch the entire monorepo for changes
  watchFolders: [monorepoRoot],

  resolver: {
    // Node modules paths to search
    nodeModulesPaths: [
      path.join(__dirname, 'node_modules'),
      path.join(monorepoRoot, 'node_modules'),
    ],

    // Extra modules mapping for pnpm compatibility
    extraNodeModules: {
      // Core React Native dependencies that Metro needs to find
      '@babel/runtime': getModulePath('@babel/runtime'),
      react: getModulePath('react'),
      'react-native': getModulePath('react-native'),
      'react-native-keychain': getModulePath('react-native-keychain'),
      // Workspace packages
      '@acme/api-client': path.join(monorepoRoot, 'packages/api-client'),
    },

    // Resolve symlinks (important for pnpm)
    unstable_enableSymlinks: true,
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
