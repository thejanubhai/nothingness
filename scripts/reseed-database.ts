import { SEED_ARTICLES } from '../lib/articles-data';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://amlxlguebzkszkwkzroe.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_j1sYCinQQ5qSdfXOA1coHA__YduyI9j';
const supabase = createClient(supabaseUrl, supabaseKey);

async function reseed() {
  console.log('🔄 Clearing old articles and inserting 20 new brand-aligned articles...');

  // 1. Delete all existing rows
  const { error: delError } = await supabase
    .from('articles')
    .delete()
    .neq('slug', 'do-not-match-anything-just-delete-all');

  if (delError) {
    console.warn('Note on delete (might be RLS):', delError.message);
  }

  // 2. Insert all 20 articles with upsert on slug
  let inserted = 0;
  for (const article of SEED_ARTICLES) {
    const { error: insError } = await supabase
      .from('articles')
      .upsert({
        slug: article.slug,
        title: article.title,
        subtitle: article.subtitle,
        excerpt: article.excerpt,
        content: article.content,
        cover_image: article.cover_image,
        category: article.category,
        format: article.format || 'essay',
        tags: article.tags,
        author_name: article.author_name,
        author_role: article.author_role,
        author_avatar: article.author_avatar,
        published_at: article.published_at,
        status: article.status,
        featured: article.featured,
        reading_time_minutes: article.reading_time_minutes,
        meta_title: article.meta_title,
        meta_description: article.meta_description,
        meta_keywords: article.meta_keywords,
        view_count: 150 + Math.floor(Math.random() * 400),
      }, { onConflict: 'slug' });

    if (insError) {
      console.error(`Error inserting ${article.slug}:`, insError.message);
    } else {
      inserted++;
    }
  }

  console.log(`✅ Successfully seeded ${inserted}/${SEED_ARTICLES.length} brand-aligned articles into Supabase!`);
}

reseed().catch(console.error);
