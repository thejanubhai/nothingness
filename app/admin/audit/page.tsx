import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ScrollText, Filter, User, Clock } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminAuditLog() {
  const supabase = await createClient();
  
  const { data: logs } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Audit Log</h1>
        <p className="text-white/50 text-sm tracking-wide">Complete record of all administrative actions across the platform.</p>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/60">
            <ScrollText className="w-4 h-4 text-accent-gold" />
            <span className="text-xs font-mono uppercase tracking-widest">Recent Activity</span>
          </div>
          <span className="text-[10px] text-white/30 font-mono">{logs?.length || 0} entries</span>
        </div>

        {/* Log Entries */}
        <div className="divide-y divide-white/5">
          {logs && logs.length > 0 ? logs.map((log: any) => (
            <div key={log.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    log.action?.includes('delete') || log.action?.includes('cancel')
                      ? 'bg-red-500/10 text-red-400'
                      : log.action?.includes('create') || log.action?.includes('insert')
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-accent-gold/10 text-accent-gold'
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
                      <p className="text-[10px] text-white/30 mt-1 font-mono">{log.admin_email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono shrink-0">
                  <Clock className="w-3 h-3" />
                  {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                </div>
              </div>
            </div>
          )) : (
            <div className="px-6 py-16 text-center">
              <ScrollText className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30 font-mono">No audit log entries recorded yet.</p>
              <p className="text-xs text-white/20 mt-1">Actions will appear here as administrators make changes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
