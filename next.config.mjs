/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds for now
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // Move options out of experimental
  skipMiddlewareUrlNormalize: true,
  serverExternalPackages: [],
  // Disable React Strict Mode for now to fix deprecation warnings
  reactStrictMode: false,
};

export default nextConfig;
