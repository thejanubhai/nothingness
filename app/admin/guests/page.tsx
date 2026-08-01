import { createClient } from "@/lib/supabase/server";
import { Search, UserCheck, UserX, Plus, ShieldCheck, Sparkles, Star } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import TrustedHostToggle from "@/components/admin/TrustedHostToggle";

export const dynamic = 'force-dynamic';

export default async function AdminGuests() {
  const supabase = await createClient();
  
  // 1. Fetch Guest Profiles
  const { data: guests } = await supabase
    .from('guest_profiles')
    .select(`
      *,
      booking_guests (
        bookings (id, check_in, check_out, spaces(title))
      )
    `)
    .order('created_at', { ascending: false });

  // 2. Fetch Kinkster Profiles
  const { data: kinksterProfiles } = await supabase
    .from('kinkster_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Guest CRM &amp; Kinkster Command Center</h1>
          <p className="text-white/50 text-sm tracking-wide">Centralized guest intelligence, ID verification, and Kinkster Trusted Host permissions.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link 
            href="/admin/guests/new" 
            className="flex items-center gap-2 bg-accent-gold text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors whitespace-nowrap shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Guest
          </Link>
        </div>
      </div>

      {/* Section 1: Kinkster Profiles & Trusted Host Controls */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-rose-400 font-mono mb-4">
          <Sparkles className="w-4 h-4" /> Kinkster Circle &amp; Sanctuary Soirée Hosts
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Kinkster Alias</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Trusted Host Permission</th>
                <th className="px-4 py-3 font-medium">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {kinksterProfiles?.map((kp) => (
                <tr key={kp.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={kp.avatar_url} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-rose-500/40" />
                      <span className="text-white font-mono font-bold text-xs">@{kp.alias}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {kp.is_activated ? (
                      <span className="text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded-md font-mono text-[10px]">
                        Active Kinkster
                      </span>
                    ) : (
                      <span className="text-zinc-500">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TrustedHostToggle alias={kp.alias} initialStatus={kp.is_trusted_host || false} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs font-mono">
                    {format(new Date(kp.created_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
              {(!kinksterProfiles || kinksterProfiles.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 text-xs">
                    No active Kinkster profiles found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: ID Verified Guests */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 font-serif text-lg text-white">
          Verified Guest Registry
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-6 py-4 font-medium">Guest Name</th>
                <th className="px-6 py-4 font-medium">ID Document</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Total Stays</th>
                <th className="px-6 py-4 font-medium">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {guests?.map((guest) => (
                <tr key={guest.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/guests/${guest.id}`} className="text-white font-medium hover:text-accent-gold transition-colors">
                      {guest.full_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white/80">{guest.id_document_type}</p>
                    <p className="text-white/40 text-xs font-mono mt-0.5">{guest.document_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    {guest.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-xs">
                        <UserCheck className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs">
                        <UserX className="w-3 h-3" /> Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    {guest.booking_guests?.length || 0} stays
                  </td>
                  <td className="px-6 py-4 text-white/40 text-xs">
                    {format(new Date(guest.created_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
              
              {(!guests || guests.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/30">
                    No guest profiles found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
