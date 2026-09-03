import { createClient } from "@/lib/supabase/server";
import { Bell, Users, Send, Clock } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminNotifications() {
  const supabase = await createClient();
  
  // Count push subscribers
  const { count: subscriberCount } = await supabase
    .from('web_push_subscriptions')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Push Broadcasts</h1>
        <p className="text-white/50 text-sm tracking-wide">Send push notifications to all subscribed users across the platform.</p>
      </div>

      {/* Subscriber Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-accent-gold" />
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Active Subscribers</p>
          </div>
          <h2 className="font-serif text-4xl text-white">{subscriberCount || 0}</h2>
          <p className="text-[10px] text-accent-gold/70 font-mono mt-1">Devices with push enabled</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-accent-gold" />
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Broadcast Status</p>
          </div>
          <h2 className="font-serif text-2xl text-white">Ready</h2>
          <p className="text-[10px] text-emerald-400 font-mono mt-1">All channels operational</p>
        </div>
      </div>

      {/* Compose Broadcast */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
          <Send className="w-5 h-5 text-accent-gold" />
          <h2 className="font-serif text-xl text-white">Compose Broadcast</h2>
        </div>

        <div className="space-y-6 max-w-2xl">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">Notification Title</label>
            <input
              type="text"
              placeholder="e.g. New Sanctuary Suite Launch 🏛️"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-gold/50"
              disabled
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">Message Body</label>
            <textarea
              rows={4}
              placeholder="Your broadcast message to all subscribers..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-gold/50 resize-none"
              disabled
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">Link URL (Optional)</label>
            <input
              type="url"
              placeholder="https://nothingness.asia/..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-gold/50"
              disabled
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <p className="text-xs text-white/30 font-mono">
              Will be sent to <span className="text-accent-gold font-bold">{subscriberCount || 0}</span> subscriber(s)
            </p>
            <button
              disabled
              className="flex items-center gap-2 px-6 py-3 bg-accent-gold/20 text-accent-gold rounded-xl text-sm font-bold uppercase tracking-wider cursor-not-allowed opacity-50"
            >
              <Send className="w-4 h-4" />
              Send Broadcast
            </button>
          </div>
          <p className="text-[10px] text-white/20 font-mono text-center">
            Push notification broadcast functionality will be fully wired once the Web Push API worker is configured.
          </p>
        </div>
      </div>
    </div>
  );
}
