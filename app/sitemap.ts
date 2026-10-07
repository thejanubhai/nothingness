import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/client';
import { SEED_ARTICLES } from '@/lib/articles-data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://amlxlguebzkszkwkzroe.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_j1sYCinQQ5qSdfXOA1coHA__YduyI9j';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Static Public Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/spaces`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sanctuary-pass`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/journal`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/franchise`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/safety`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/accessibility`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/the-circle`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/the-circle/discover`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/the-circle/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/the-circle/groups`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/the-circle/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/legal/cancellation`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/legal/shipping`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/legal/pricing`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/legal/liability`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // 2. Dynamic Sanctuary Spaces
  let spaceRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: spaces } = await supabase
      .from('spaces')
      .select('slug, updated_at')
      .eq('active', true);

    if (spaces && spaces.length > 0) {
      spaceRoutes = spaces.map((space) => ({
        url: `${baseUrl}/spaces/${space.slug}`,
        lastModified: space.updated_at ? new Date(space.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));
    }
  } catch (err) {
    console.error('Error fetching spaces for sitemap:', err);
  }

  // 3. Dynamic Journal & Blog Articles
  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, published_at, updated_at')
      .eq('status', 'published');

    const sourceArticles = (articles && articles.length > 0) ? articles : SEED_ARTICLES;

    articleRoutes = sourceArticles.map((article: any) => ({
      url: `${baseUrl}/journal/${article.slug}`,
      lastModified: article.updated_at ? new Date(article.updated_at) : new Date(article.published_at),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));
  } catch (err) {
    console.error('Error fetching articles for sitemap, using seed fallback:', err);
    articleRoutes = SEED_ARTICLES.map((article) => ({
      url: `${baseUrl}/journal/${article.slug}`,
      lastModified: new Date(article.published_at),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));
  }

  return [...staticRoutes, ...spaceRoutes, ...articleRoutes];
}
