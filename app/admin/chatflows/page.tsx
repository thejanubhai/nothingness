import { createClient } from "@/lib/supabase/server";
import { Bot, Plus, Zap, MessageSquare, ToggleLeft, ToggleRight, Settings } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminChatflows() {
  const supabase = await createClient();
  
  const { data: chatflows } = await supabase
    .from('chatflows')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Chatflows</h1>
          <p className="text-white/50 text-sm tracking-wide">Configure automated omnichannel responses.</p>
        </div>
        <button className="flex items-center gap-2 bg-accent-gold text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors">
          <Plus className="w-4 h-4" />
          Create Flow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chatflows?.map((flow) => (
          <div key={flow.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                <Bot className="w-5 h-5" />
              </div>
              <button className="text-white/30 hover:text-white transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="text-lg text-white font-medium mb-1">{flow.name}</h3>
            <div className="flex items-center gap-2 text-xs text-white/50 mb-6">
              <Zap className="w-3 h-3 text-yellow-500" />
              Trigger: {flow.trigger_event}
            </div>
            
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-6 flex-1">
              <p className="text-xs text-white/60 line-clamp-3">"{flow.response_template}"</p>
            </div>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-white/40 uppercase tracking-wider">
                <MessageSquare className="w-3 h-3" />
                {flow.channel}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${flow.is_active ? 'text-green-400' : 'text-white/30'}`}>
                  {flow.is_active ? 'Active' : 'Paused'}
                </span>
                {flow.is_active ? (
                  <ToggleRight className="w-5 h-5 text-green-400 cursor-pointer" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-white/30 cursor-pointer" />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty state or Create New Card */}
        <div className="bg-white/[0.01] border border-white/5 border-dashed p-6 rounded-2xl flex flex-col items-center justify-center min-h-[250px] cursor-pointer hover:bg-white/[0.03] transition-colors group">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-accent-gold group-hover:bg-accent-gold/10 transition-colors mb-4">
            <Plus className="w-6 h-6" />
          </div>
          <p className="text-white font-medium text-sm">Create New Chatflow</p>
          <p className="text-white/40 text-xs mt-1 text-center max-w-[200px]">Automate responses for bookings, check-ins, or common questions.</p>
        </div>
      </div>
    </div>
  );
}
