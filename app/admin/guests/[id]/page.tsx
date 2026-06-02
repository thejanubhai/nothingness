import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, UserCheck, UserX, FileText, Phone, Mail, Calendar, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function GuestProfilePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: guest } = await supabase
    .from('guest_profiles')
    .select(`
      *,
      booking_guests (
        bookings (id, check_in, check_out, total_price, status, spaces(title))
      )
    `)
    .eq('id', id)
    .single();

  if (!guest) {
    notFound();
  }

  const stays = guest.booking_guests || [];
  const totalSpent = stays.reduce((sum: number, stay: any) => sum + (stay.bookings?.total_price || 0), 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/guests" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-1 text-white">{guest.full_name}</h1>
          <p className="text-white/50 text-sm tracking-wide">Guest ID: {guest.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-medium text-white mb-6 uppercase tracking-widest">Contact Info</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Mail className="w-4 h-4 text-white/40" />
                {guest.email || 'No email on file'}
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Phone className="w-4 h-4 text-white/40" />
                {guest.phone || 'No phone on file'}
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <MapPin className="w-4 h-4 text-white/40" />
                Registered: {format(new Date(guest.created_at), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-medium text-white mb-6 uppercase tracking-widest flex items-center justify-between">
              Verification
              {guest.is_verified ? (
                <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Verified</span>
              ) : (
                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Pending</span>
              )}
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Document Type</p>
                <p className="text-sm text-white/80">{guest.id_document_type || 'None provided'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Document Number</p>
                <p className="text-sm text-white/80 font-mono">{guest.document_number || '-'}</p>
              </div>
              
              {guest.id_document_url && (
                <div className="pt-4 mt-4 border-t border-white/5">
                  <a 
                    href={guest.id_document_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    View ID Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Total Stays</p>
              <p className="text-3xl font-serif text-white">{stays.length}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Total Value</p>
              <p className="text-3xl font-serif text-accent-gold">₹{totalSpent.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            <h2 className="text-sm font-medium text-white p-6 border-b border-white/5 uppercase tracking-widest">Stay History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.01] border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="px-6 py-4 font-medium">Space</th>
                    <th className="px-6 py-4 font-medium">Check In</th>
                    <th className="px-6 py-4 font-medium">Check Out</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stays.map((stay: any, idx: number) => {
                    const booking = stay.bookings;
                    if (!booking) return null;
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{booking.spaces?.title || 'Unknown'}</p>
                        </td>
                        <td className="px-6 py-4 text-white/70">
                          {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-white/70">
                          {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-white/60">{booking.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                  
                  {stays.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-white/30 text-sm">
                        No stay history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
