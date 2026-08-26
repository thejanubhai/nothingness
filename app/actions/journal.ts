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

export async function generateArticleWithAI(params: {
  topic: string;
  category?: string;
  targetKeywords?: string[];
  intent?: string;
  customPrompt?: string;
}) {
  const { topic, category = 'AI & Search Strategy', targetKeywords = [], intent = '', customPrompt = '' } = params;

  try {
    let rawResult: any = null;

    // Check if GEMINI_API_KEY is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const systemPrompt = `You are a world-class architectural curator, senior hospitality growth strategist, and SEO/GEO expert writing for "Nothingness" (nothingness.asia) - India's Premier Alternate Lifestyle & Luxury Sanctuary Brand.
        
CRITICAL RULES YOU MUST NEVER BREAK:
1. ZERO EM DASHES (— or – or --). Absolutely NO em dashes or en dashes anywhere. Use colons (:), commas (,), semicolons (;), parentheses (()), or separate short sentences instead.
2. HUMAN CADENCE & NATURAL VOICE: Absolutely NO generic AI buzzwords or cliché transitions (do NOT use "In conclusion", "Delve into", "Tapestry", "Beacon", "Testament", "It is crucial to note", "Furthermore", "In summary"). Write with clear, authoritative, human precision.
3. INDIA-TARGETED CONTEXT: Naturally reference Indian luxury metros (South Delhi, DLF Phase 5 Gurgaon, Indiranagar Bangalore, Assagao North Goa, South Mumbai), local regulatory realities (Delhi Police Form C digital vetting), and exact architectural/operational metrics (e.g. STC 55 acoustic ratings, 70/30 revenue share).
4. MARKDOWN STRUCTURE: Output substantial body content with ## Section Headings, ### Subsections, bullet points, and > blockquotes.

Respond with ONLY valid raw JSON with this exact structure:
{
  "title": "Compelling Title",
  "slug": "url-friendly-slug",
  "subtitle": "Sharp thesis hook",
  "excerpt": "High-density 2-sentence summary (under 280 chars)",
  "content": "Full markdown body with ## headings, * bullets, and > quotes without any em-dashes",
  "category": "${category}",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "reading_time_minutes": 6,
  "meta_title": "SEO Title (under 60 chars)",
  "meta_description": "Meta description (under 155 chars)",
  "meta_keywords": ["keyword 1", "keyword 2"]
}`;

        const promptText = `Topic: ${topic}
Category: ${category}
Target Audience / Search Intent: ${intent || 'High-ticket Indian luxury staycation and search optimization'}
Custom Direction: ${customPrompt || 'In-depth, practical, research-backed perspective'}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          }
        });

        if (response.text) {
          rawResult = JSON.parse(response.text);
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed or timed out, falling back to built-in generator:', geminiErr);
      }
    }

    // High quality deterministic fallback generator if no API key or API fails
    if (!rawResult) {
      const cleanSlug = topic
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const defaultTags = targetKeywords.length > 0 
        ? targetKeywords 
        : ['AI SEO', 'Generative Engine Optimization', 'Delhi NCR Stays', 'Hospitality Tech'];

      rawResult = {
        title: topic,
        slug: cleanSlug,
        subtitle: `Strategic analysis and operational frameworks for modern hospitality in Indian metros`,
        excerpt: `A comprehensive analysis of ${topic.toLowerCase()}, detailing structural optimization, search discovery dynamics, and high-ticket customer acquisition across India.`,
        content: `## The Modern Landscape of ${topic}

In the evolving landscape of Indian luxury hospitality and experiential real estate, ${topic.toLowerCase()} has transitioned from an experimental concept into a foundational operational requirement. As search platforms move from simple keyword queries toward Generative Engine Optimization (GEO) and conversational retrieval, consumer discovery patterns across Delhi NCR, Bangalore, and Mumbai are fundamentally changing.

Traditional search optimization focused on index volume. Today, autonomous algorithms evaluate semantic entity strength, verified customer sentiment, and specific technical parameters before presenting a destination as a verified answer in AI snapshots.

## Key Strategic Pillars

To achieve commanding visibility and sustainable direct reservations, properties must anchor their positioning around three critical pillars:

* **Entity Clarity and Structured Schema**: Clear semantic definitions across HotelRoom, Organization, and Place schemas ensure search models understand physical amenities, location boundaries, and guest policies without ambiguity.
* **Acoustic and Spatial Integrity**: Modern travelers in dense urban hubs like South Delhi and Gurgaon actively seek sanctuaries engineered with decoupled wall assemblies and heavy sound isolation ratings.
* **Autonomous Guest Journeys**: Implementing encrypted digital lockboxes and government ID pre-screening satisfies state regulatory mandates while preserving total guest privacy.

> Discretion and architectural uniqueness represent the ultimate luxury currency in modern Indian metros. Systems that protect guest anonymity while delivering seamless access consistently command higher occupancy and pricing power.

## Practical Implementation Blueprint

1. **Audit Technical Entities**: Ensure all metadata, canonical links, and OpenGraph tags accurately reflect your property's unique physical characteristics.
2. **Target Conversational Intent**: Structure editorial content around natural questions that discerning travelers input into generative search engines.
3. **Streamline Direct Operations**: Eliminate friction at the point of booking and arrival to build authentic brand loyalty and organic citations.

By aligning physical space design with generative search discovery, boutique hospitality brands build an enduring competitive moat that outperforms traditional OTA-dependent distribution channels.`,
        category: category,
        tags: defaultTags,
        reading_time_minutes: 6,
        meta_title: `${topic} | Nothingness Journal`,
        meta_description: `In-depth analysis of ${topic.toLowerCase()} for luxury hospitality and search optimization in India.`,
        meta_keywords: defaultTags
      };
    }

    // POST-PROCESSING STRICT SANITIZER: Purge all em-dashes and en-dashes
    const sanitize = (str: string = '') => {
      return str
        .replace(/[\u2014\u2015]/g, ': ')
        .replace(/[\u2013]/g, '-')
        .replace(/--/g, '-');
    };

    const sanitizedResult: Partial<Article> = {
      title: sanitize(rawResult.title),
      slug: (rawResult.slug || cleanSlug(rawResult.title)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      subtitle: sanitize(rawResult.subtitle),
      excerpt: sanitize(rawResult.excerpt),
      content: sanitize(rawResult.content),
      category: rawResult.category || category,
      tags: rawResult.tags || ['AI SEO', 'Hospitality'],
      author_name: 'Kabir Varma',
      author_role: 'Chief Strategy Architect',
      author_avatar: '/images/logo.png',
      cover_image: '/images/The Void (1).png',
      status: 'published',
      featured: false,
      reading_time_minutes: rawResult.reading_time_minutes || 6,
      published_at: new Date().toISOString(),
      meta_title: sanitize(rawResult.meta_title || rawResult.title),
      meta_description: sanitize(rawResult.meta_description || rawResult.excerpt),
      meta_keywords: rawResult.meta_keywords || rawResult.tags || [],
    };

    return { success: true, article: sanitizedResult };
  } catch (err: any) {
    console.error('generateArticleWithAI error:', err);
    return { success: false, error: err.message || 'Failed to generate article' };
  }
}

function cleanSlug(title: string) {
  return (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

