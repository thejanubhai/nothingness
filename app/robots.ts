import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin/*',
          '/dashboard/',
          '/dashboard/*',
          '/api/',
          '/api/*',
          '/booking/*/verify',
          '/auth/check-email',
        ],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'],
        allow: [
          '/',
          '/spaces',
          '/spaces/*',
          '/journal',
          '/journal/*',
          '/about',
          '/franchise',
          '/faq',
          '/media',
          '/safety',
          '/accessibility',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
