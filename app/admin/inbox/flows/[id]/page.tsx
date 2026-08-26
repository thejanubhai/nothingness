'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Bot, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { generateChatflowTemplate } from '@/app/actions/ai';

import { use } from 'react';

export default function EditFlowPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    trigger_event: 'keyword',
    trigger_keyword: '',
    response_template: '',
    channel: 'all',
    is_active: true,
  });

  const id = resolvedParams.id;

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const supabase = createClient();
        const { data, error: fetchErr } = await supabase
          .from('chatflows')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchErr) throw fetchErr;
        
        if (data) {
          setFormData({
            name: data.name || '',
            trigger_event: data.trigger_event || 'keyword',
            trigger_keyword: data.trigger_keyword || '',
            response_template: data.response_template || '',
            channel: data.channel || 'all',
            is_active: data.is_active,
          });
        }
      } catch (err: unknown) {
        console.error(err);
        setError('Failed to load chatflow');
        toast.error('Failed to load chatflow');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void fetchFlow();
    }
  }, [id]);

  const handleAiGenerate = async () => {
    setIsAiGenerating(true);
    toast.loading('Refining response template...');
    try {
      const res = await generateChatflowTemplate(formData.name, formData.trigger_event, formData.response_template);
      toast.dismiss();
      if (res.success) {
        setFormData((prev) => ({
          ...prev,
          response_template: res.response_template || prev.response_template,
          trigger_keyword: prev.trigger_event === 'keyword' && res.suggested_keyword ? res.suggested_keyword : prev.trigger_keyword,
        }));
        toast.success('AI refined template successfully!');
      } else {
        toast.error(res.error || 'AI generation failed');
      }
    } catch {
      toast.dismiss();
      toast.error('Failed to run AI assistance');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('chatflows')
        .update({
          name: formData.name,
          trigger_event: formData.trigger_event,
          trigger_keyword: formData.trigger_event === 'keyword' ? formData.trigger_keyword : null,
          response_template: formData.response_template,
          channel: formData.channel,
          is_active: formData.is_active,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      toast.success('Chatflow updated successfully!');
      router.push('/admin/inbox?tab=chatflows');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update chatflow';
      setError(msg);
      toast.error('Failed to update chatflow');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this chatflow?')) return;
    
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase.from('chatflows').delete().eq('id', id);
      if (delErr) throw delErr;
      
      toast.success('Chatflow deleted successfully!');
      router.push('/admin/inbox?tab=chatflows');
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to delete chatflow');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[50vh] text-white/50">Loading flow data...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/inbox?tab=chatflows" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl mb-1 text-white">Edit Flow</h1>
            <p className="text-white/50 text-sm tracking-wide">Modify automated response behavior or refine with AI assistance.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDelete}
            disabled={saving}
            className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={handleSubmit}
            disabled={saving || !formData.name || !formData.response_template}
            className="flex items-center gap-2 bg-accent-gold text-black px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-accent-gold" />
              <h2 className="font-serif text-xl text-white">Flow Configuration</h2>
            </div>

            <button
              type="button"
              onClick={() => void handleAiGenerate()}
              disabled={isAiGenerating}
              className="flex items-center gap-2 bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold border border-accent-gold/30 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isAiGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isAiGenerating ? 'Refining...' : 'Refine Template with AI'}
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Flow Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                placeholder="e.g., Welcome Message"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Trigger Event</label>
                <select 
                  value={formData.trigger_event}
                  onChange={(e) => setFormData({...formData, trigger_event: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                >
                  <option value="keyword" className="bg-black text-white">Specific Keyword</option>
                  <option value="booking_confirmed" className="bg-black text-white">Booking Confirmed</option>
                  <option value="check_in" className="bg-black text-white">Check-in Day</option>
                  <option value="check_out" className="bg-black text-white">Check-out Day</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Target Channel</label>
                <select 
                  value={formData.channel}
                  onChange={(e) => setFormData({...formData, channel: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                >
                  <option value="all" className="bg-black text-white">All Active Channels</option>
                  <option value="whatsapp" className="bg-black text-white">WhatsApp</option>
                  <option value="email" className="bg-black text-white">Email</option>
                  <option value="sms" className="bg-black text-white">SMS</option>
                </select>
              </div>
            </div>

            {formData.trigger_event === 'keyword' && (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Trigger Keyword</label>
                <input 
                  required
                  type="text" 
                  value={formData.trigger_keyword}
                  onChange={(e) => setFormData({...formData, trigger_keyword: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50 font-mono"
                  placeholder="e.g., ac, wifi, checkin, available, tools"
                />
                <p className="text-[10px] text-white/30">The exact word or phrase that will trigger this automated response.</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Response Template</label>
                <button
                  type="button"
                  onClick={() => void handleAiGenerate()}
                  disabled={isAiGenerating}
                  className="text-[10px] text-accent-gold hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Polish with AI
                </button>
              </div>
              <textarea 
                required
                rows={6}
                value={formData.response_template}
                onChange={(e) => setFormData({...formData, response_template: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                placeholder="Hello {{guest_name}}! Here are the details for your stay..."
              />
              <p className="text-[10px] text-white/30">You can use variables like: {`{{guest_name}}`}, {`{{check_in_date}}`}, {`{{space_title}}`}</p>
            </div>
            
            <div className="flex items-center pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 rounded border-white/10 text-accent-gold focus:ring-accent-gold bg-transparent"
                />
                <span className="text-sm text-white">Flow is Active</span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
