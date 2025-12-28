import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// Bundle analyzer (optional, run with ANALYZE=true)
// Note: @next/bundle-analyzer needs to be installed as a dev dependency
let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === 'true') {
  try {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
  } catch (e) {
    console.warn('@next/bundle-analyzer not installed. Run: pnpm add -D @next/bundle-analyzer');
  }
}

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Note: experimental.turbo.root is not a valid Next.js 16.1.1 option
  // The workspace root warning can be silenced by removing the duplicate lockfile
  // or by using a .npmrc/.yarnrc configuration
  // Exclude parent directory from Next.js file scanning
  // This prevents Next.js from treating ../src/middleware.ts as a Next.js middleware file
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      
      // Code splitting optimizations
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for large libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Separate chunk for Fumadocs UI
            fumadocs: {
              name: 'fumadocs',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](fumadocs-ui|fumadocs-core|fumadocs-typescript|fumadocs-openapi|fumadocs-mdx)[\\/]/,
              priority: 30,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    // Disable image optimization for documentation (no images used)
    unoptimized: true,
    // Remote patterns if needed for external images
    remotePatterns: [],
  },
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/docs/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  // Rewrite rule for .mdx extension to LLM route
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/:path*',
      },
    ];
  },
};

export default withBundleAnalyzer(withMDX(config));
