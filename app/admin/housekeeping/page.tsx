import { createClient } from "@/lib/supabase/server";
import { format, isToday, isTomorrow } from "date-fns";
import { Sparkles, CheckCircle2, Circle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminHousekeeping() {
  const supabase = await createClient();
  
  // Get tasks from database
  const { data: tasks } = await supabase
    .from('housekeeping_tasks')
    .select(`
      *,
      spaces (title),
      bookings (id, check_in, check_out, guests)
    `)
    .order('scheduled_date', { ascending: true });

  // Generate automated tasks based on bookings if none exist for today/tomorrow
  const { data: activeBookings } = await supabase
    .from('bookings')
    .select('id, check_in, check_out, space_id, spaces(title)')
    .eq('status', 'confirmed');
    
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Housekeeping Operations</h1>
        <p className="text-white/50 text-sm tracking-wide">Manage room turnovers and daily cleaning schedules.</p>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
          <Sparkles className="w-5 h-5 text-accent-gold" />
          <h2 className="font-serif text-2xl text-white">Upcoming Tasks</h2>
        </div>
        
        <div className="space-y-4">
          {tasks?.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors group">
              <div className="flex items-start gap-4">
                <button className="mt-0.5 text-white/30 hover:text-accent-gold transition-colors">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">{task.spaces?.title}</h3>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm bg-white/10 text-white/60">
                      {task.task_type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-white/50">
                    {task.description || `Prepare room for ${task.bookings?.guests || 2} guests.`}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-widest text-white/40">
                    <span>Scheduled: {format(new Date(task.scheduled_date), 'MMM dd, yyyy')}</span>
                    {task.assigned_to && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>Assigned to: {task.assigned_to}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-md border ${
                  task.status === 'completed' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                  task.status === 'in_progress' ? 'text-accent-gold border-accent-gold/20 bg-accent-gold/10' :
                  'text-white/60 border-white/10 bg-white/5'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
          
          {(!tasks || tasks.length === 0) && (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
              <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No housekeeping tasks scheduled at this moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
