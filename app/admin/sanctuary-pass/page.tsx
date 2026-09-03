import { createClient } from "@/lib/supabase/server";
import { Ticket, Users, Calendar, CreditCard, Settings } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminSanctuaryPass() {
  const supabase = await createClient();
  
  // Fetch sanctuary pass settings
  const { data: passSettings } = await supabase
    .from('sanctuary_pass_settings')
    .select('*')
    .maybeSingle();

  // Fetch passes sold
  const { data: passes, count: totalPasses } = await supabase
    .from('sanctuary_passes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch upcoming sanctuary events
  const { data: events, count: totalEvents } = await supabase
    .from('sanctuary_events')
    .select('*', { count: 'exact' })
    .order('event_date', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Sanctuary Pass</h1>
          <p className="text-white/50 text-sm tracking-wide">Manage pass tiers, pricing, and member access to private gatherings.</p>
        </div>
        <Link
          href="/sanctuary-pass"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs transition-colors self-start"
        >
          View Public Page →
        </Link>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">Total Passes Sold</p>
          <h2 className="font-serif text-3xl text-white">{totalPasses || 0}</h2>
          <p className="text-[10px] text-accent-gold/70 font-mono mt-1">Lifetime Members</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">Sanctuary Events</p>
          <h2 className="font-serif text-3xl text-white">{totalEvents || 0}</h2>
          <p className="text-[10px] text-accent-gold/70 font-mono mt-1">Total Created</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">Pass Status</p>
          <h2 className="font-serif text-3xl text-white">{passSettings ? 'Active' : 'Not Configured'}</h2>
          <p className="text-[10px] text-accent-gold/70 font-mono mt-1">{passSettings?.price ? `₹${Number(passSettings.price).toLocaleString('en-IN')}` : 'Set pricing below'}</p>
        </div>
      </div>

      {/* Pass Configuration */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
          <Settings className="w-5 h-5 text-accent-gold" />
          <h2 className="font-serif text-xl text-white">Pass Configuration</h2>
        </div>
        
        {passSettings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(passSettings).filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key)).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40 block font-mono">{key.replace(/_/g, ' ')}</label>
                <p className="text-sm text-white bg-white/5 border border-white/10 rounded-lg p-3 font-mono">
                  {value === null ? '—' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Ticket className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No sanctuary pass settings configured yet.</p>
            <p className="text-xs text-white/20 mt-1">Pass settings will be populated once the sanctuary pass feature is fully configured in the database.</p>
          </div>
        )}
      </div>

      {/* Recent Passes */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-gold" />
            <h2 className="font-serif text-xl text-white">Recent Pass Holders</h2>
          </div>
          <span className="text-[10px] text-white/30 font-mono">{totalPasses || 0} total</span>
        </div>

        {passes && passes.length > 0 ? (
          <div className="divide-y divide-white/5">
            {passes.map((pass: any) => (
              <div key={pass.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{pass.user_name || pass.user_id?.substring(0, 8) || 'Member'}</p>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">{pass.pass_type || 'Standard'} • {pass.status || 'Active'}</p>
                </div>
                <span className="text-[10px] text-white/30 font-mono">{pass.created_at ? new Date(pass.created_at).toLocaleDateString() : '—'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/30 text-center py-8 font-mono">No sanctuary passes issued yet.</p>
        )}
      </div>
    </div>
  );
}
