import { createClient } from "@/lib/supabase/server";
import AdminSpacesClient from "@/components/admin/AdminSpacesClient";

export const dynamic = 'force-dynamic';

export default async function AdminSpaces() {
  const supabase = await createClient();
  
  const { data: spaces } = await supabase
    .from('spaces')
    .select('*')
    .order('created_at', { ascending: false });

  return <AdminSpacesClient initialSpaces={spaces || []} />;
}
