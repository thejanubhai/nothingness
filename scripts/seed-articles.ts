import { createClient } from '@supabase/supabase-js';
import { SEED_ARTICLES } from './lib/articles-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://amlxlguebzkszkwkzroe.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_j1sYCinQQ5qSdfXOA1coHA__YduyI9j';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log(`Starting seed of ${SEED_ARTICLES.length} articles...`);
  
  for (const article of SEED_ARTICLES) {
    const { data, error } = await supabase
      .from('articles')
      .upsert({
        slug: article.slug,
        title: article.title,
        subtitle: article.subtitle || null,
        excerpt: article.excerpt,
        content: article.content,
        cover_image: article.cover_image,
        category: article.category,
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
        view_count: Math.floor(Math.random() * 450) + 120,
      }, { onConflict: 'slug' })
      .select();

    if (error) {
      console.error(`Error inserting ${article.slug}:`, error.message);
    } else {
      console.log(`✓ Seeded article: ${article.slug}`);
    }
  }
  
  console.log('Seeding complete!');
}

seed().catch(console.error);
