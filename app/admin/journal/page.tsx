import { getAllAdminArticles } from '@/app/actions/journal';
import AdminJournalClient from '@/components/admin/AdminJournalClient';

export const dynamic = 'force-dynamic';

export default async function AdminJournalPage() {
  const articles = await getAllAdminArticles();

  return <AdminJournalClient initialArticles={articles} />;
}
