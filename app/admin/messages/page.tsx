import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Mail, Briefcase, CheckCircle, Clock, ExternalLink, MessageSquare } from "lucide-react";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminBadge from "@/components/admin/ui/AdminBadge";

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

  const unreadCount = (messages || []).filter((m) => m.status === 'unread').length;

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      <AdminPageHeader
        title="Contact Inquiries"
        description="Public guest inquiries, correspondence and inbound franchise partner interest."
        badge={unreadCount > 0 ? `${unreadCount} Unread` : 'All Clear'}
        badgeVariant={unreadCount > 0 ? 'amber' : 'emerald'}
      />

      {/* Contact Messages Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Mail className="w-4 h-4 text-accent-gold" />
            <h2 className="font-serif text-xl font-bold">Public Web Inquiries</h2>
          </div>
          <span className="text-xs font-mono text-white/40">
            {messages?.length || 0} Total Messages
          </span>
        </div>
        
        <div className="grid grid-cols-1 gap-3.5">
          {messages?.map((msg) => (
            <div 
              key={msg.id} 
              className="bg-zinc-950/60 border border-white/5 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row gap-6 shadow-xl backdrop-blur-md hover:border-white/10 transition-all"
            >
              <div className="md:w-1/4 shrink-0 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-6 space-y-1">
                <p className="text-white font-bold text-sm">{msg.name || 'Anonymous Guest'}</p>
                <p className="text-xs text-accent-gold/80 font-mono truncate">{msg.email}</p>
                {msg.phone && <p className="text-xs text-white/50 font-mono">{msg.phone}</p>}
                <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono pt-3">
                  <Clock className="w-3 h-3" />
                  {format(new Date(msg.created_at), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <AdminBadge status={msg.status || 'unread'} />
                    
                    <div className="flex items-center gap-2">
                      <a 
                        href={`mailto:${msg.email}?subject=Re: Your Inquiry to Nothingness`} 
                        className="text-xs bg-accent-gold hover:bg-white text-black px-3 py-1.5 rounded-xl font-mono font-bold transition-colors"
                      >
                        Reply via Email
                      </a>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {(!messages || messages.length === 0) && (
            <div className="text-center py-12 bg-white/[0.01] rounded-3xl border border-white/5">
              <Mail className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/40 font-mono">No contact messages received yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Franchise & Partner Leads Section */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Briefcase className="w-4 h-4 text-accent-gold" />
            <h2 className="font-serif text-xl font-bold">Inbound Franchise Applications</h2>
          </div>
          <span className="text-xs font-mono text-white/40">
            {franchiseLeads?.length || 0} Leads
          </span>
        </div>
        
        <div className="grid grid-cols-1 gap-3.5">
          {franchiseLeads?.map((lead) => (
            <div 
              key={lead.id} 
              className="bg-zinc-950/60 border border-white/5 rounded-3xl p-5 sm:p-6 flex flex-col lg:flex-row gap-6 shadow-xl backdrop-blur-md"
            >
              <div className="lg:w-1/4 shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 pb-4 lg:pb-0 lg:pr-6 space-y-1">
                <p className="text-white font-bold text-sm">{lead.name}</p>
                <p className="text-xs text-accent-gold/80 font-mono truncate">{lead.email}</p>
                {lead.phone && <p className="text-xs text-white/50 font-mono">{lead.phone}</p>}
                <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono pt-3">
                  <Clock className="w-3 h-3" />
                  {format(new Date(lead.created_at), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <AdminBadge status={lead.status || 'new'} />
                  </div>
                  
                  <div className="space-y-3 font-mono">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Target Location</p>
                      <p className="text-sm text-white/90 font-medium">{lead.property_location || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Investment Budget</p>
                      <p className="text-sm text-accent-gold font-medium">{lead.investment_budget || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-mono">Space Details / Vision</p>
                  <div className="text-xs text-white/70 leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/5 h-[calc(100%-28px)] whitespace-pre-wrap overflow-y-auto max-h-48 font-mono">
                    {lead.message || lead.experience || 'No additional details provided.'}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {(!franchiseLeads || franchiseLeads.length === 0) && (
            <div className="text-center py-12 bg-white/[0.01] rounded-3xl border border-white/5">
              <Briefcase className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/40 font-mono">No franchise applications recorded.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
