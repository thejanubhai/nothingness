import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ScrollText, User, Clock, ShieldCheck } from "lucide-react";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";

export const dynamic = 'force-dynamic';

export default async function AdminAuditLog() {
  const supabase = await createClient();
  
  const { data: logs } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <AdminPageHeader
        title="Audit Log"
        description="Immutable, tamper-evident chronological ledger of all administrative actions across Nothingness."
        badge="Security"
        badgeVariant="emerald"
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-white/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{logs?.length || 0} Recent Events</span>
          </div>
        }
      />

      <div className="bg-zinc-950/60 border border-white/5 rounded-3xl overflow-hidden shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2 text-white/70">
            <ScrollText className="w-4 h-4 text-accent-gold" />
            <span className="text-xs font-mono uppercase tracking-widest font-bold">Activity Ledger</span>
          </div>
          <span className="text-[10px] text-white/30 font-mono">Real-Time Tamper Protection</span>
        </div>

        {/* Log Entries */}
        <div className="divide-y divide-white/5">
          {logs && logs.length > 0 ? logs.map((log: any) => (
            <div key={log.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    log.action?.includes('delete') || log.action?.includes('cancel')
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                      : log.action?.includes('create') || log.action?.includes('insert')
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                      : 'bg-accent-gold/10 border-accent-gold/25 text-accent-gold'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-white font-medium">{log.action || 'Unknown Action'}</span>
                      {log.resource_type && (
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 font-mono">
                          {log.resource_type}
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-xs text-white/40 mt-1 line-clamp-2 max-w-xl font-mono">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                      </p>
                    )}
                    {log.admin_email && (
                      <p className="text-[10px] text-accent-gold/70 mt-1 font-mono">{log.admin_email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono shrink-0">
                  <Clock className="w-3 h-3 text-white/30" />
                  {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                </div>
              </div>
            </div>
          )) : (
            <div className="px-6 py-16 text-center">
              <ScrollText className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30 font-mono">No audit log entries recorded yet.</p>
              <p className="text-xs text-white/20 mt-1 font-sans">Actions will appear here as administrators modify system state.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
