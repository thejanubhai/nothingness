import { createClient } from "@/lib/supabase/server";
import AdminHousekeepingClient from "@/components/admin/AdminHousekeepingClient";

export const dynamic = 'force-dynamic';

export default async function AdminHousekeeping() {
  const supabase = await createClient();
  
  // Get tasks from database with space & booking details
  const { data: tasks } = await supabase
    .from('housekeeping_tasks')
    .select(`
      *,
      spaces (title, cleaner_name, cleaner_phone, check_out_time, check_in_time),
      bookings (id, check_in, check_out, guests)
    `)
    .order('scheduled_date', { ascending: false });

  // Get active spaces for task scheduler modal
  const { data: spaces } = await supabase
    .from('spaces')
    .select('id, title, cleaner_name, cleaner_phone')
    .order('title', { ascending: true });

  return (
    <AdminHousekeepingClient 
      initialTasks={(tasks as any) || []} 
      spaces={(spaces as any) || []} 
    />
  );
}
