import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const supabase = await createClient();
  
  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/spaces`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/franchise`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  ];

  // Dynamic space routes
  const { data: spaces } = await supabase
    .from('spaces')
    .select('slug, updated_at')
    .eq('active', true);

  if (spaces) {
    const spaceRoutes = spaces.map((space) => ({
      url: `${baseUrl}/spaces/${space.slug}`,
      lastModified: new Date(space.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
    routes.push(...spaceRoutes);
  }

  return routes;
}
