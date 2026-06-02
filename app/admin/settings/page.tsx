import { Settings2, Key, Link2, Shield, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function AdminSettings() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('*')
    .single();

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Platform Settings</h1>
        <p className="text-white/50 text-sm tracking-wide">Configure integrations, security, and global preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Global Settings */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
            <Settings2 className="w-5 h-5 text-accent-gold" />
            <h2 className="font-serif text-xl text-white">System Configuration</h2>
          </div>
          
          <form className="space-y-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Maintenance Mode</label>
              <select 
                defaultValue={settings?.maintenance_mode ? 'true' : 'false'}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              >
                <option value="false" className="bg-black text-white">System Online (Normal Operations)</option>
                <option value="true" className="bg-black text-white">Maintenance Mode (Offline)</option>
              </select>
            </div>
            
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Admin Contact Email</label>
              <input 
                type="email" 
                defaultValue={settings?.admin_contact_email || 'admin@nothingness.asia'}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
              />
            </div>
            
            <button type="button" className="w-full flex items-center justify-center gap-2 bg-accent-gold text-black hover:bg-accent-gold/90 py-3 rounded-lg text-sm font-medium transition-colors mt-4">
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </form>
        </div>

        {/* Integrations */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
            <Link2 className="w-5 h-5 text-accent-gold" />
            <h2 className="font-serif text-xl text-white">Active Integrations</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <p className="text-white font-medium mb-1">Cashfree Payments</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Connected (Production)</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <p className="text-white font-medium mb-1">Resend Email Delivery</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Connected (Production)</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <p className="text-white font-medium mb-1">Gemini AI (ID Verification)</p>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Connected (Production)</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
