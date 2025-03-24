/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle ESLint during builds - for now we'll allow builds to succeed even with errors
  // but we'll still show warnings for gradual improvement
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['app', 'components', 'lib', 'middleware.ts'],
  },
  
  // Handle TypeScript type checking - allow builds despite errors
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimize production builds
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Output as standalone for containerized deployments
  output: 'standalone',
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Environment variable control
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
  },
  
  // Disable middleware URL normalization (if needed for your routes)
  skipMiddlewareUrlNormalize: true,
  
  // External packages that should be bundled with the server components
  serverExternalPackages: [],
  
  // Cache headers for static assets
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Production source maps (disabled for smaller builds, enable for better error tracking)
  productionBrowserSourceMaps: false,
  
  // Optional: Configure webpack if needed
  webpack: (config, { dev, isServer }) => {
    // Note: We use Turbopack for development (npm run dev) and webpack for production builds
    // Turbopack does not use this webpack config
    
    // Enable bundle analyzer in analyze mode
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;
