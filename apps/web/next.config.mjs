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

  // Configure remote image patterns for Next.js Image optimization
  images: {
    remotePatterns: [
      // Vercel Blob storage
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      // OpenAI DALL-E generated images
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
    ],
  },
};

export default nextConfig;
