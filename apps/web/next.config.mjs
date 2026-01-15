const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ENABLE_REACT_COMPILER = process.env.ENABLE_REACT_COMPILER === 'true';

const INTERNAL_PACKAGES = [
  '@kit/ui',
  '@kit/auth',
  '@kit/accounts',
  '@kit/shared',
  '@kit/supabase',
  '@kit/i18n',
  '@kit/next',
];

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: INTERNAL_PACKAGES,
  images: {
    remotePatterns: getRemotePatterns(),
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  serverExternalPackages: [],
  // needed for supporting dynamic imports for local content
  outputFileTracingIncludes: {
    '/*': ['./content/**/*'],
  },
  reactCompiler: ENABLE_REACT_COMPILER,
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  experimental: {
    mdxRs: true,
    optimizePackageImports: [
      'recharts',
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-avatar',
      '@radix-ui/react-select',
      'date-fns',
      ...INTERNAL_PACKAGES,
    ],
  },
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: '/(.*)',
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
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          }
        ],
      },
    ];
  },
};

export default config;

function getRemotePatterns() {
  /** @type {import('next').NextConfig['remotePatterns']} */
  const remotePatterns = [];

  if (SUPABASE_URL) {
    const hostname = new URL(SUPABASE_URL).hostname;

    remotePatterns.push({
      protocol: 'https',
      hostname,
    });
  }

  return IS_PRODUCTION
    ? remotePatterns
    : [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ];
}
