import { createClient } from "./supabase/server";

export async function logAdminAction(
  action: string, 
  entity_type: string, 
  entity_id: string | null = null, 
  details: any = {}
) {
  try {
    const supabase = await createClient();
    
    // Get current user (admin)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: user.id,
        action,
        entity_type,
        entity_id,
        details
      });
      
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Non-blocking, so we swallow the error
  }
}
