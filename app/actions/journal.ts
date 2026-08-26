'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { SEED_ARTICLES, Article } from '@/lib/articles-data';

export async function getPublishedArticles(): Promise<Article[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return SEED_ARTICLES.filter((a) => a.status === 'published');
    }

    return data as Article[];
  } catch (err) {
    console.error('Failed to fetch articles from Supabase, using fallback:', err);
    return SEED_ARTICLES.filter((a) => a.status === 'published');
  }
}

export async function getAllAdminArticles(): Promise<Article[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return SEED_ARTICLES;
    }

    return data as Article[];
  } catch (err) {
    console.error('Failed to fetch admin articles from Supabase, using fallback:', err);
    return SEED_ARTICLES;
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      const fallback = SEED_ARTICLES.find((a) => a.slug === slug);
      return fallback || null;
    }

    return data as Article;
  } catch (err) {
    console.error('Failed to fetch article by slug from Supabase, using fallback:', err);
    const fallback = SEED_ARTICLES.find((a) => a.slug === slug);
    return fallback || null;
  }
}

export async function createArticle(payload: Partial<Article>) {
  try {
    const supabase = await createClient();
    
    // Ensure slug is clean
    const cleanSlug = (payload.slug || payload.title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { data, error } = await supabase
      .from('articles')
      .insert({
        slug: cleanSlug,
        title: payload.title,
        subtitle: payload.subtitle || null,
        excerpt: payload.excerpt,
        content: payload.content,
        cover_image: payload.cover_image || '/images/The Void (1).png',
        category: payload.category || 'AI & Search Strategy',
        tags: payload.tags || ['AI SEO', 'Hospitality'],
        author_name: payload.author_name || 'Nothingness Editorial',
        author_role: payload.author_role || 'Hospitality & Culture Curator',
        author_avatar: payload.author_avatar || '/images/logo.png',
        published_at: payload.published_at || new Date().toISOString(),
        status: payload.status || 'published',
        featured: payload.featured ?? false,
        reading_time_minutes: payload.reading_time_minutes || 5,
        meta_title: payload.meta_title || payload.title,
        meta_description: payload.meta_description || payload.excerpt,
        meta_keywords: payload.meta_keywords || [],
        view_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/journal');
    revalidatePath('/blog');
    revalidatePath('/admin/journal');
    revalidatePath('/sitemap.xml');

    return { success: true, article: data };
  } catch (err: any) {
    console.error('createArticle error:', err);
    return { success: false, error: err.message || 'Failed to create article' };
  }
}

export async function updateArticle(id: string, payload: Partial<Article>) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('articles')
      .update({
        title: payload.title,
        subtitle: payload.subtitle,
        excerpt: payload.excerpt,
        content: payload.content,
        cover_image: payload.cover_image,
        category: payload.category,
        tags: payload.tags,
        author_name: payload.author_name,
        author_role: payload.author_role,
        published_at: payload.published_at,
        status: payload.status,
        featured: payload.featured,
        reading_time_minutes: payload.reading_time_minutes,
        meta_title: payload.meta_title,
        meta_description: payload.meta_description,
        meta_keywords: payload.meta_keywords,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/journal');
    revalidatePath('/blog');
    if (payload.slug) {
      revalidatePath(`/journal/${payload.slug}`);
      revalidatePath(`/blog/${payload.slug}`);
    }
    revalidatePath('/admin/journal');
    revalidatePath('/sitemap.xml');

    return { success: true, article: data };
  } catch (err: any) {
    console.error('updateArticle error:', err);
    return { success: false, error: err.message || 'Failed to update article' };
  }
}

export async function deleteArticle(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/journal');
    revalidatePath('/blog');
    revalidatePath('/admin/journal');
    revalidatePath('/sitemap.xml');

    return { success: true };
  } catch (err: any) {
    console.error('deleteArticle error:', err);
    return { success: false, error: err.message || 'Failed to delete article' };
  }
}

export async function incrementArticleViews(slug: string) {
  try {
    const supabase = await createClient();
    const { data: current } = await supabase
      .from('articles')
      .select('id, view_count')
      .eq('slug', slug)
      .single();

    if (current) {
      await supabase
        .from('articles')
        .update({ view_count: (current.view_count || 0) + 1 })
        .eq('id', current.id);
    }
  } catch (e) {
    // Silent fail for analytics
  }
}

export async function getTopicSuggestions() {
  return [
    {
      topic: "Generative Engine Optimization (GEO) for High-End Lifestyle Resorts in Goa & Delhi",
      intent: "High-ticket direct bookings via Perplexity & Google SGE",
      difficulty: "Medium",
      targetQueries: ["luxury private stay geo india", "ai search optimization hospitality", "delhi high ticket staycation seo"]
    },
    {
      topic: "The Science of Acoustic Isolation in Metropolitan Boutique Hotels",
      intent: "Architectural and luxury branding authority",
      difficulty: "Low",
      targetQueries: ["soundproof luxury suites south delhi", "acoustic privacy boutique stays", "stc 55 hotel walls india"]
    },
    {
      topic: "Entity SEO Mastery: How Modern Search Engines Classify Boutique Accommodations",
      intent: "Semantic authority and Knowledge Panel trigger",
      difficulty: "High",
      targetQueries: ["entity seo for hotels", "schema markup boutique hospitality", "knowledge graph brand optimization"]
    },
    {
      topic: "Autonomous Keyless Hospitality: Delhi Police Compliance and Frictionless ID Verification",
      intent: "Trust, safety, legal authority and brand discretion",
      difficulty: "Low",
      targetQueries: ["keyless check in hotel compliance india", "delhi police guest id verification", "private discreet sanctuary stay"]
    },
    {
      topic: "Unit Economics of Niche Sanctuaries vs Residential Leasing in South Delhi & Gurgaon",
      intent: "Franchise and real estate partner acquisition",
      difficulty: "Medium",
      targetQueries: ["airbnb franchise model delhi", "boutique stay roi gurgaon", "high yield hospitality real estate india"]
    }
  ];
}
