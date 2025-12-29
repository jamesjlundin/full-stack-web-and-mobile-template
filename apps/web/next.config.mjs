/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages that export TypeScript source
  transpilePackages: [
    '@acme/ai',
    '@acme/auth',
    '@acme/db',
    '@acme/obs',
    '@acme/rag',
    '@acme/security',
    '@acme/tools',
  ],
};

export default nextConfig;
