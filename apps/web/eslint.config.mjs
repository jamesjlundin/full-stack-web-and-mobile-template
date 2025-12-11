import nextPlugin from '@next/eslint-plugin-next';
import baseConfig from '../../packages/config/eslint.config.mjs';

const nextRecommendedRules = nextPlugin.configs.recommended.rules;
const nextCoreWebVitalsRules = nextPlugin.configs['core-web-vitals'].rules;

export default [
  ...baseConfig,
  {
    name: 'next/core-web-vitals',
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextRecommendedRules,
      ...nextCoreWebVitalsRules,
    },
  },
];
