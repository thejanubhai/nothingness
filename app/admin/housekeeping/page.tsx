import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Sparkles, CheckCircle2, Circle, Eye, ShieldCheck, Phone } from "lucide-react";
import HousekeepingDispatchButton from "@/components/admin/HousekeepingDispatchButton";

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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Housekeeping &amp; AI Vision Turnover</h1>
          <p className="text-white/50 text-sm tracking-wide">
            Automated WhatsApp cleaner dispatches and Gemini AI Vision cleanliness photo inspections.
          </p>
        </div>

        <HousekeepingDispatchButton />
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-accent-gold" />
            <h2 className="font-serif text-2xl text-white">Turnover Tasks &amp; AI Inspection Reports</h2>
          </div>
          <span className="text-xs text-white/40 font-mono">{tasks?.length || 0} Scheduled Tasks</span>
        </div>
        
        <div className="space-y-4">
          {tasks?.map((task) => {
            const space: any = Array.isArray(task.spaces) ? task.spaces[0] : task.spaces;
            const cleanerName = task.assigned_to || space?.cleaner_name || 'Housekeeping Team';
            const cleanerPhone = space?.cleaner_phone;
            const aiScore = task.ai_cleanliness_score || 0;
            const aiResult = task.ai_inspection_result as { summary?: string; timestamp?: string } | null;

            return (
              <div key={task.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 hover:border-white/10 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-white/30 flex-shrink-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium">{space?.title || 'Sanctuary Space'}</h3>
                        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm bg-white/10 text-white/60">
                          {task.task_type}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">
                        {task.description || `Turnover cleaning for next guest.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status === 'completed' && aiScore > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-mono">
                        <ShieldCheck className="w-3.5 h-3.5" /> AI Score: {aiScore}/100
                      </span>
                    )}

                    <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                      task.status === 'completed' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                      task.status === 'in_progress' ? 'text-accent-gold border-accent-gold/20 bg-accent-gold/10' :
                      'text-white/60 border-white/10 bg-white/5'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Cleaner Details & AI Vision Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/5 text-xs text-white/60">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Cleaner Assignment</p>
                    <p className="text-white font-medium">{cleanerName}</p>
                    {cleanerPhone && (
                      <p className="text-white/40 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-accent-gold" /> {cleanerPhone}
                      </p>
                    )}
                    <p className="text-[10px] text-white/30 mt-1">
                      Scheduled: {format(new Date(task.scheduled_date), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Gemini AI Vision Inspection</p>
                    {aiResult?.summary ? (
                      <p className="text-white/80 leading-relaxed">{aiResult.summary}</p>
                    ) : (
                      <p className="text-white/30 italic">Awaiting WhatsApp photo upload from cleaner...</p>
                    )}

                    {task.inspection_image_url && (
                      <a 
                        href={task.inspection_image_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-accent-gold hover:underline mt-2"
                      >
                        <Eye className="w-3 h-3" /> View Inspection Photo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {(!tasks || tasks.length === 0) && (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
              <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No housekeeping tasks scheduled at this moment.</p>
              <p className="text-xs text-white/20 mt-1">Click &quot;Auto-Dispatch WhatsApp Alerts&quot; to schedule tasks for today&apos;s checkouts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
