import ArticleEditorForm from '@/components/admin/ArticleEditorForm';

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; category?: string; tags?: string }>;
}) {
  const params = await searchParams;

  const initialData = {
    title: params.title || '',
    category: (params.category as any) || 'Dynamics & Kink Culture',
    tags: params.tags ? params.tags.split(',') : ['Power Dynamics', 'Intimacy'],
    cover_image: '/images/The Void (1).png',
    author_name: 'Kabir Varma',
    author_role: 'Resident Curator of Lifestyle Dynamics',
    reading_time_minutes: 7,
    status: 'published' as const,
  };

  return <ArticleEditorForm initialData={initialData} isNew={true} />;
}
