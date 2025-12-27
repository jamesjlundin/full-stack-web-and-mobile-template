/**
 * Jest setup file for React Native 0.83+
 * Custom setup to avoid ESM issues with the default react-native/jest/setup.js
 */

'use strict';

global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

Object.defineProperties(global, {
  __DEV__: {
    configurable: true,
    enumerable: true,
    value: true,
    writable: true,
  },
  cancelAnimationFrame: {
    configurable: true,
    enumerable: true,
    value(id) {
      return clearTimeout(id);
    },
    writable: true,
  },
  nativeFabricUIManager: {
    configurable: true,
    enumerable: true,
    value: {},
    writable: true,
  },
  performance: {
    configurable: true,
    enumerable: true,
    value: {
      now: jest.fn(Date.now),
    },
    writable: true,
  },
  regeneratorRuntime: {
    configurable: true,
    enumerable: true,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    value: require('regenerator-runtime/runtime'),
    writable: true,
  },
  requestAnimationFrame: {
    configurable: true,
    enumerable: true,
    value(callback) {
      return setTimeout(() => callback(jest.now()), 0);
    },
    writable: true,
  },
  window: {
    configurable: true,
    enumerable: true,
    value: global,
    writable: true,
  },
});
