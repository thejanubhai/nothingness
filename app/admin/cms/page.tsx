import { createClient } from "@/lib/supabase/server";
import CmsClient, { CmsBlock } from "./CmsClient";

export const dynamic = 'force-dynamic';

export default async function AdminCmsPage() {
  const supabase = await createClient();
  const { data: blocks } = await supabase
    .from('cms_content_blocks')
    .select('*')
    .order('block_key', { ascending: true });

  return <CmsClient initialBlocks={(blocks as CmsBlock[]) || []} />;
}
