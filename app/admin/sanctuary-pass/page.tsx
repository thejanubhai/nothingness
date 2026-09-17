import { createClient } from "@/lib/supabase/server";
import { Ticket, Users, Calendar, CreditCard, Settings, ExternalLink } from "lucide-react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminMetricCard from "@/components/admin/ui/AdminMetricCard";
import AdminBadge from "@/components/admin/ui/AdminBadge";

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
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <AdminPageHeader
        title="Sanctuary Pass"
        description="Manage membership tiers, pass holder vetting, pricing, and access permissions for private gatherings."
        badge="Access Control"
        badgeVariant="purple"
        actions={
          <Link
            href="/sanctuary-pass"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono transition-colors"
          >
            <span>View Public Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-accent-gold" />
          </Link>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminMetricCard
          label="Passes Issued"
          value={(totalPasses || 0).toString()}
          subtext="Lifetime Members"
          icon={Users}
          highlightColor="gold"
        />

        <AdminMetricCard
          label="Sanctuary Events"
          value={(totalEvents || 0).toString()}
          subtext="Exclusive Gatherings"
          icon={Calendar}
          highlightColor="purple"
        />

        <AdminMetricCard
          label="Pass Status"
          value={passSettings ? 'Active' : 'Unconfigured'}
          subtext={passSettings?.price ? `₹${Number(passSettings.price).toLocaleString('en-IN')} Base Tier` : 'Config needed'}
          icon={Ticket}
          highlightColor={passSettings ? 'emerald' : 'amber'}
        />
      </div>

      {/* Pass Configuration */}
      <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
          <Settings className="w-5 h-5 text-accent-gold" />
          <h2 className="font-serif text-xl text-white font-bold">Pass Configuration Parameters</h2>
        </div>
        
        {passSettings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(passSettings).filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key)).map(([key, value]) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/40 block font-mono">
                  {key.replace(/_/g, ' ')}
                </label>
                <div className="text-sm text-white bg-white/[0.02] border border-white/5 rounded-xl p-3 font-mono">
                  {value === null ? '—' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Ticket className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-mono">No sanctuary pass parameters active yet.</p>
            <p className="text-xs text-white/20 mt-1 font-sans">Pass configurations are maintained dynamically via platform settings.</p>
          </div>
        )}
      </div>

      {/* Recent Passes */}
      <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-gold" />
            <h2 className="font-serif text-xl text-white font-bold">Recent Pass Holders</h2>
          </div>
          <span className="text-[10px] text-white/30 font-mono">{totalPasses || 0} total</span>
        </div>

        {passes && passes.length > 0 ? (
          <div className="divide-y divide-white/5">
            {passes.map((pass: any) => (
              <div key={pass.id} className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                <div>
                  <p className="text-sm text-white font-medium">
                    {pass.user_name || pass.user_id?.substring(0, 8) || 'Member'}
                  </p>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">
                    {pass.pass_type || 'Standard'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <AdminBadge status={pass.status || 'active'} />
                  <span className="text-[10px] text-white/30 font-mono">
                    {pass.created_at ? new Date(pass.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>
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
