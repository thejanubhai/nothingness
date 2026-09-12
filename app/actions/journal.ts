'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { SEED_ARTICLES, Article } from '@/lib/articles-data';
import {
  generateContextualImageForArticle,
  generateContextualImagesForAllArticles,
  buildContextualPrompt,
  generateImageBuffer,
  persistJournalImage,
} from '@/lib/ai/image-generator';

export async function getPublishedArticles(): Promise<Article[]> {
  try {
    const supabase = createAdminClient();
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
    const supabase = createAdminClient();
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
        category: payload.category || 'Dynamics & Kink Culture',
        format: payload.format || 'essay',
        tags: payload.tags || ['Power Dynamics', 'Intimacy'],
        author_name: payload.author_name || 'Nothingness Editorial',
        author_role: payload.author_role || 'Resident Curator of Lifestyle Dynamics',
        author_avatar: payload.author_avatar || '/images/logo.png',
        published_at: payload.published_at || new Date().toISOString(),
        status: payload.status || 'published',
        featured: payload.featured ?? false,
        reading_time_minutes: payload.reading_time_minutes || 6,
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

    const updateData: any = {
      title: payload.title,
      subtitle: payload.subtitle,
      excerpt: payload.excerpt,
      content: payload.content,
      cover_image: payload.cover_image,
      category: payload.category,
      format: payload.format || 'essay',
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
    };

    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
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
  const { topic, category = 'Dynamics & Kink Culture', targetKeywords = [], intent = '', customPrompt = '' } = params;

  try {
    let rawResult: any = null;

    // 1. Primary AI Engine: NVIDIA Llama 3.3 70B (Free, high-speed, anti-cliché)
    try {
      const { generateArticleWithNvidia } = await import('@/lib/ai/nvidia');
      const nvidiaRes = await generateArticleWithNvidia(params);
      if (nvidiaRes.success && nvidiaRes.article) {
        rawResult = nvidiaRes.article;
      }
    } catch (nvidiaErr) {
      console.warn('NVIDIA AI article generation warning, falling back to Gemini:', nvidiaErr);
    }

    // 2. Secondary Fallback: Google Gemini 2.5 Flash
    if (!rawResult && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const systemPrompt = `You are a world-class intimacy researcher, somatic educator, and curator writing for "Nothingness" (nothingness.asia) - India's Premier Alternate Lifestyle & Luxury Sanctuary Brand.
        
CRITICAL BRAND RULES:
1. FOCUS ON LIFESTYLE & DYNAMICS: Write deeply about alternate lifestyles, relationship dynamics (D/s, power exchange, roleplay, ethical non-monogamy, praise kink), BDSM safety, consent frameworks, aftercare, sensory exploration, and navigating privacy in urban India.
2. ZERO THIRD-PARTY ADVERTISING: Never mention or advertise external properties, hotels, or commercial competitors. Focus purely on psychological insight, relationship dynamics, and sensory sanctuary living.
3. ZERO EM DASHES (— or – or --). Absolutely NO em dashes or en dashes anywhere. Use colons (:), commas (,), semicolons (;), parentheses (()), or separate short sentences instead.
4. HUMAN CADENCE & NATURAL VOICE: Absolutely NO generic AI buzzwords or robotic clichés (do NOT use "In conclusion", "Delve into", "Tapestry", "Beacon", "Testament", "It is crucial to note", "Furthermore", "In summary"). Write with raw, sophisticated, human authority.
5. INDIA-SPECIFIC REALITY: Naturally ground insights in Indian social dynamics (joint families, residential surveillance, navigating conservative taboos, urban metro realities across Delhi NCR, Mumbai, and Bangalore).
6. MARKDOWN STRUCTURE: Output substantial body content with ## Section Headings, ### Subsections, bullet points, and > blockquotes.

Respond with ONLY valid raw JSON with this exact structure:
{
  "title": "Compelling Title",
  "slug": "url-friendly-slug",
  "subtitle": "Sharp thesis hook",
  "excerpt": "High-density 2-sentence summary (under 280 chars)",
  "content": "Full markdown body with ## headings, * bullets, and > quotes without any em-dashes",
  "category": "${category}",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "reading_time_minutes": 7,
  "meta_title": "SEO Title (under 60 chars)",
  "meta_description": "Meta description (under 155 chars)",
  "meta_keywords": ["keyword 1", "keyword 2"]
}`;

        const promptText = `Topic: ${topic}
Category: ${category}
Target Audience / Intent: ${intent || 'Modern Indian couples and lifestyle practitioners exploring intimacy and dynamics'}
Custom Direction: ${customPrompt || 'In-depth, psychological, practical, and grounded in Indian context'}`;

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
        : ['Alternate Lifestyle', 'Intimacy Dynamics', 'Consent Culture', 'Relationships'];

      rawResult = {
        title: topic,
        slug: cleanSlug,
        subtitle: `An honest exploration of boundaries, somatic presence, and personal freedom in modern India`,
        excerpt: `A grounded perspective on ${topic.toLowerCase()}, navigating intimacy dynamics, consent protocols, and emotional safety within the urban Indian landscape.`,
        content: `## The Modern Context of ${topic}

In contemporary urban India, conversations surrounding relationship dynamics, personal boundaries, and alternative lifestyle exploration are shifting rapidly. For decades, societal conditioning demanded that intimacy remain rigid, unspoken, and strictly conformist. Today, open-minded couples and individuals across metros like Delhi, Mumbai, and Bangalore are actively deconstructing inherited taboos to build relationships grounded in radical honesty and emotional safety.

When exploring non-traditional dynamics, whether involving power exchange, sensory deprivation, or intentional roleplay, the first hurdle is always psychological: separating authentic desire from external societal shame.

## Core Pillars of Conscious Exploration

To engage with ${topic.toLowerCase()} safely and sustainably, partners must anchor their practice in three non-negotiable principles:

* **Explicit Verbal Negotiation**: Assumptions destroy trust. Using structured frameworks like the Yes/No/Maybe list ensures that every activity is preceded by informed, enthusiastic consent.
* **The Safety Architecture**: Establishing clear safe words (such as the universal Red, Yellow, Green system) provides an impenetrable container of control, allowing the submissive or exploring partner to surrender defenses completely.
* **Somatic Presence and Aftercare**: The conclusion of an intense scene or emotional exploration requires grounding. Providing physical warmth, hydration, verbal reassurance, and quiet holding stabilizes the nervous system.

> True intimacy is not the absence of boundaries; it is the freedom to explore fearlessly inside a container built entirely of mutual trust and respect.

## Practical Steps for Modern Indian Couples

1. **Have the Conversation in Daylight**: Discuss new desires and boundaries over coffee or dinner, never five minutes before entering an intimate space.
2. **Seek Unmonitored Sanctuary**: Escape the surveillance of domestic life, shared apartments, or nosy environments by carving out private spaces designed for complete acoustic and mental discretion.
3. **Honor the Emotional Arc**: Allow yourself to experience vulnerability without self-judgment. Curiosity is a natural expression of human depth.`,
        category: category,
        tags: defaultTags,
        reading_time_minutes: 7,
        meta_title: `${topic} | Nothingness Journal`,
        meta_description: `An in-depth guide to ${topic.toLowerCase()} exploring relationship dynamics and intimacy in modern India.`,
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

    const articleSlug = (rawResult.slug || cleanSlug(rawResult.title)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Contextual Cover Image Generation (Strict Anti-AI Realism)
    let generatedCover = `/images/journal/${articleSlug}.jpg`;
    try {
      const prompt = buildContextualPrompt({
        title: sanitize(rawResult.title),
        slug: articleSlug,
        category: rawResult.category || category,
        excerpt: sanitize(rawResult.excerpt),
        tags: rawResult.tags,
      });
      const buffer = await generateImageBuffer(prompt);
      const { localPath } = await persistJournalImage(articleSlug, buffer);
      if (localPath) generatedCover = localPath;
    } catch (imgErr) {
      console.warn('[Journal AI] Cover image generation notice, falling back to static path:', imgErr);
    }

    const sanitizedResult: Partial<Article> = {
      title: sanitize(rawResult.title),
      slug: articleSlug,
      subtitle: sanitize(rawResult.subtitle),
      excerpt: sanitize(rawResult.excerpt),
      content: sanitize(rawResult.content),
      category: rawResult.category || category,
      tags: rawResult.tags || ['AI SEO', 'Hospitality'],
      author_name: 'Kabir Varma',
      author_role: 'Chief Strategy Architect',
      author_avatar: '/images/logo.png',
      cover_image: generatedCover,
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

export async function generateArticleCoverImageAction(
  articleIdentifier: string,
  customPrompt?: string
) {
  return await generateContextualImageForArticle(articleIdentifier, { customPrompt });
}

export async function generateAllArticleCoverImagesAction(options?: { onlyRoomImages?: boolean; forceRegenerate?: boolean }) {
  return await generateContextualImagesForAllArticles(options);
}

function cleanSlug(title: string) {
  return (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}


