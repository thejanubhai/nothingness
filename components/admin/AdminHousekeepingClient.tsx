'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Sparkles, CheckCircle2, Circle, Eye, ShieldCheck, Phone, 
  Plus, Clock, Play, Check, X, Filter 
} from 'lucide-react';
import HousekeepingDispatchButton from '@/components/admin/HousekeepingDispatchButton';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';

interface HousekeepingTask {
  id: string;
  space_id: string;
  task_type: string;
  status: string;
  scheduled_date: string;
  description?: string;
  assigned_to?: string;
  ai_cleanliness_score?: number;
  ai_inspection_result?: { summary?: string; timestamp?: string } | null;
  inspection_image_url?: string;
  spaces?: {
    title: string;
    cleaner_name?: string;
    cleaner_phone?: string;
  };
  bookings?: {
    id: string;
    check_in: string;
    check_out: string;
  };
}

interface Space {
  id: string;
  title: string;
  cleaner_name?: string;
  cleaner_phone?: string;
}

export default function AdminHousekeepingClient({
  initialTasks,
  spaces
}: {
  initialTasks: HousekeepingTask[];
  spaces: Space[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<HousekeepingTask[]>(initialTasks);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form State
  const [newTaskSpaceId, setNewTaskSpaceId] = useState(spaces[0]?.id || '');
  const [newTaskDate, setNewTaskDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTaskDescription, setNewTaskDescription] = useState('Turnover Cleaning & Sanitation');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    return tasks.filter(t => t.status === statusFilter);
  }, [tasks, statusFilter]);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId);
    try {
      const res = await fetch('/api/admin/housekeeping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Task status marked as ${newStatus.replace('_', ' ')}`);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to update task');
      }
    } catch {
      toast.error('Network error updating task');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: newTaskSpaceId,
          scheduled_date: newTaskDate,
          description: newTaskDescription,
          assigned_to: newTaskAssignedTo || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Housekeeping task created!');
        setTasks(prev => [data.task, ...prev]);
        setShowNewTaskModal(false);
      } else {
        toast.error(data.error || 'Failed to create task');
      }
    } catch {
      toast.error('Network error creating task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Housekeeping & Cleanliness Automation"
        description="Automated cleaner WhatsApp dispatches and optical cleanliness validation."
        badge="Operations"
        actions={
          <>
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <Plus className="w-4 h-4" /> Schedule Cleaning
            </button>
            <HousekeepingDispatchButton />
          </>
        }
      />

      {/* Task Filters */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'pending', label: 'Pending' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'completed', label: 'Completed' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              statusFilter === tab.id
                ? 'bg-accent-gold text-black font-bold shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-accent-gold" />
            <h2 className="font-serif text-2xl text-white">Turnover Queue &amp; Reports</h2>
          </div>
          <span className="text-xs text-white/40 font-mono">{filteredTasks.length} Active Tasks</span>
        </div>

        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const space = task.spaces;
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
                    ) : task.status === 'in_progress' ? (
                      <Clock className="w-5 h-5 text-accent-gold flex-shrink-0" />
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

                  {/* Actions & Status Pill */}
                  <div className="flex items-center gap-2">
                    {task.status === 'completed' && aiScore > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-mono">
                        <ShieldCheck className="w-3.5 h-3.5" /> AI Score: {aiScore}/100
                      </span>
                    )}

                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                        disabled={updatingId === task.id}
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Play className="w-3 h-3" /> Start
                      </button>
                    )}

                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'completed')}
                        disabled={updatingId === task.id}
                        className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Check className="w-3 h-3" /> Mark Cleaned
                      </button>
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

                {/* Cleaner Details & AI Inspection */}
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
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Optical Turnover Inspection</p>
                    {aiResult?.summary ? (
                      <p className="text-white/80 leading-relaxed">{aiResult.summary}</p>
                    ) : (
                      <p className="text-white/30 italic">Awaiting cleaner turnover inspection photo...</p>
                    )}

                    {task.inspection_image_url && (
                      <a 
                        href={task.inspection_image_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-accent-gold hover:underline mt-2"
                      >
                        <Eye className="w-3 h-3" /> View Cleanliness Photo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
              <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No housekeeping tasks found matching criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* SCHEDULE TASK MODAL */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setShowNewTaskModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-accent-gold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Schedule Turnover
            </div>
            <h2 className="font-serif text-2xl text-white">Create Housekeeping Task</h2>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Select Sanctuary</label>
                <select
                  value={newTaskSpaceId}
                  onChange={(e) => setNewTaskSpaceId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none"
                >
                  {spaces.map(s => (
                    <option key={s.id} value={s.id} className="bg-black text-white">{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Scheduled Date</label>
                <input
                  type="date"
                  required
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Assigned Cleaner (Optional)</label>
                <input
                  type="text"
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                  placeholder="Leave empty to use Space default"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-accent-gold hover:bg-white text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 mt-4"
              >
                {submitting ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
