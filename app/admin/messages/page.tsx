import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Mail, Briefcase, CheckCircle, Clock } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminMessages() {
  const supabase = await createClient();
  
  const { data: messages } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
    
  const { data: franchiseLeads } = await supabase
    .from('franchise_leads')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Communications</h1>
        <p className="text-white/50 text-sm tracking-wide">Manage contact inquiries and franchise applications.</p>
      </div>

      {/* Contact Messages Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Mail className="w-5 h-5 text-accent-gold" />
          <h2 className="font-serif text-2xl text-white">Contact Messages</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {messages?.map((msg) => (
            <div key={msg.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6">
              <div className="md:w-1/4 shrink-0 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-6 space-y-1">
                <p className="text-white font-medium">{msg.name}</p>
                <p className="text-xs text-white/50">{msg.email}</p>
                {msg.phone && <p className="text-xs text-white/50">{msg.phone}</p>}
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-4">
                  {format(new Date(msg.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-[9px] uppercase tracking-widest rounded-sm border ${
                      msg.status === 'read' ? 'bg-white/5 text-white/40 border-white/10' :
                      'bg-accent-gold/10 text-accent-gold border-accent-gold/20'
                    }`}>
                      {msg.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {msg.status === 'unread' && (
                      <button className="text-xs flex items-center gap-1 text-white/40 hover:text-white transition-colors">
                        <CheckCircle className="w-3 h-3" /> Mark as Read
                      </button>
                    )}
                    <a href={`mailto:${msg.email}?subject=Re: Your Inquiry to Nothingness`} className="text-xs bg-accent-gold text-black px-3 py-1.5 rounded-md hover:bg-accent-gold/90 transition-colors font-medium">
                      Reply to Guest
                    </a>
                  </div>
                </div>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          ))}
          
          {(!messages || messages.length === 0) && (
            <p className="text-sm text-white/30 text-center py-8 bg-white/[0.01] rounded-2xl border border-white/5">
              No contact messages found.
            </p>
          )}
        </div>
      </section>

      {/* Franchise Leads Section */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Briefcase className="w-5 h-5 text-accent-gold" />
          <h2 className="font-serif text-2xl text-white">Franchise Applications</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {franchiseLeads?.map((lead) => (
            <div key={lead.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col lg:flex-row gap-6">
              <div className="lg:w-1/4 shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 pb-4 lg:pb-0 lg:pr-6 space-y-1">
                <p className="text-white font-medium">{lead.name}</p>
                <p className="text-xs text-white/50">{lead.email}</p>
                {lead.phone && <p className="text-xs text-white/50">{lead.phone}</p>}
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-4">
                  {format(new Date(lead.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4 flex gap-2">
                    <span className={`px-2 py-1 text-[9px] uppercase tracking-widest rounded-sm border ${
                      lead.status === 'new' ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' :
                      lead.status === 'contacted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      lead.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Target Location</p>
                      <p className="text-sm text-white/80">{lead.property_location}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Investment Budget</p>
                      <p className="text-sm text-white/80">{lead.investment_budget}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Experience / Background</p>
                  <p className="text-sm text-white/60 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 h-[calc(100%-24px)]">
                    {lead.experience || 'No background information provided.'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {(!franchiseLeads || franchiseLeads.length === 0) && (
            <p className="text-sm text-white/30 text-center py-8 bg-white/[0.01] rounded-2xl border border-white/5">
              No franchise applications found.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
