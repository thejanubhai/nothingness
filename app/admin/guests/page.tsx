import { createClient } from "@/lib/supabase/server";
import { Search, UserCheck, UserX, Plus } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import ComingSoonButton from "@/components/ComingSoonButton";
export const dynamic = 'force-dynamic';

export default async function AdminGuests() {
  const supabase = await createClient();
  
  const { data: guests } = await supabase
    .from('guest_profiles')
    .select(`
      *,
      booking_guests (
        bookings (id, check_in, check_out, spaces(title))
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Guest CRM</h1>
          <p className="text-white/50 text-sm tracking-wide">Centralized guest intelligence and verification records.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search guests..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/50 transition-all"
            />
          </div>
          <Link 
            href="/admin/guests/new" 
            className="flex items-center gap-2 bg-accent-gold text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Guest
          </Link>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
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
