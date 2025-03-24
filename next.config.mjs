/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use static export for demonstration purposes
  output: 'export',
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
};

export default nextConfig;
