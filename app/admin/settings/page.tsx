import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export const dynamic = 'force-dynamic';

export default async function AdminSettings() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('*')
    .single();

  return <SettingsClient initialSettings={settings} />;
}
