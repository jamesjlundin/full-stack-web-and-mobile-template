/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// Get the monorepo root
const monorepoRoot = path.resolve(__dirname, '../..');

/**
 * Metro configuration for pnpm monorepo
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // Watch both the app directory and shared packages
  watchFolders: [
    monorepoRoot,
  ],

  resolver: {
    // Resolve modules from both local and root node_modules
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],

    // Disable hierarchical lookup to avoid pnpm symlink issues
    disableHierarchicalLookup: true,

    // Extra node_modules to resolve (for pnpm compatibility)
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => {
          // First try local node_modules
          const localPath = path.join(__dirname, 'node_modules', String(name));
          try {
            require.resolve(localPath);
            return localPath;
          } catch {
            // Fall back to root node_modules
            return path.join(monorepoRoot, 'node_modules', String(name));
          }
        },
      },
    ),
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
