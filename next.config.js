/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    'qrcode',
    'node-ical',
    '@google/genai',
    'cloudinary',
    'tesseract.js',
    'firebase-admin',
    '@scout_apm/scout-apm'
  ],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'sonner',
      'yet-another-react-lightbox',
      'resend',
      'zod'
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/kinksters',
        destination: '/the-circle',
        permanent: true,
      },
      {
        source: '/kinksters/:path*',
        destination: '/the-circle/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
