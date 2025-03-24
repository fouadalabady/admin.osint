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
  // Skip type checking and linting on CI builds
  experimental: {
    // Set to false to skip both linting and type checking during builds
    skipTypechecking: true,
    skipMiddlewareUrlNormalize: true,
    // For packages that should be bundled with server components
    serverComponentsExternalPackages: []
  }
};

export default nextConfig;
