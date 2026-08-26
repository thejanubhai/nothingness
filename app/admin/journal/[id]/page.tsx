import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ArticleEditorForm from '@/components/admin/ArticleEditorForm';
import { SEED_ARTICLES, Article } from '@/lib/articles-data';

export const dynamic = 'force-dynamic';

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let article: Article | null = null;

  try {
    const supabase = await createClient();
    
    // Try by UUID
    let query = supabase.from('articles').select('*');
    if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data } = await query.single();
    if (data) {
      article = data as Article;
    }
  } catch (err) {
    console.error('Error fetching article for editing:', err);
  }

  if (!article) {
    const fallback = SEED_ARTICLES.find((a) => a.slug === id);
    if (fallback) article = fallback;
  }

  if (!article) {
    notFound();
  }

  return <ArticleEditorForm initialData={article} isNew={false} />;
}
