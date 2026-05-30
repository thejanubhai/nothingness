import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle, Clock, ShieldAlert, Eye } from 'lucide-react';
import { cancelBooking } from '@/app/actions/booking';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || (!user.email?.includes('admin') && !user.email?.includes('hudav'))) {
    redirect('/');
  }
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      properties (title),
      booking_guests (
        id, name, verification_status, guest_index, 
        guest_profile_id, guest_profiles (document_number, full_name, is_verified)
      )
    `)
    .order('created_at', { ascending: false });

  const totalRevenue = bookings ? bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + Number(b.total_price), 0) : 0;
  const activeBookings = bookings ? bookings.filter(b => b.status === 'confirmed').length : 0;

  const stats = [
    { label: "Total Revenue (Paid)", value: `₹${totalRevenue.toLocaleString()}` },
    { label: "Active Bookings", value: activeBookings.toString() },
    { label: "Total Processed", value: bookings ? bookings.length.toString() : "0" }
  ];

  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16 border-b border-white/10 pb-10">
        <h1 className="font-serif text-4xl md:text-5xl mb-4 text-accent-gold">Command Center</h1>
        <p className="text-white/50 font-sans tracking-wide">Nothingness Sanctuary Operations & Guest Intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl hover:border-accent-gold/20 transition-colors">
            <p className="text-[11px] uppercase tracking-widest text-white/40 mb-4">{stat.label}</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-serif text-2xl mb-8 border-b border-white/10 pb-4 text-white">Booking & Verification Feed</h3>
        <div className="space-y-6">
          {bookings && bookings.length > 0 ? bookings.map((booking: any) => (
            <div key={booking.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col lg:flex-row gap-8">
              
              {/* Booking Info */}
              <div className="w-full lg:w-1/3 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-accent-gold uppercase tracking-widest mb-1">REF: {booking.id.split('-')[0]}</p>
                    <h4 className="text-xl text-white">{booking.properties?.title}</h4>
                  </div>
                  <span className={`px-2 py-1 text-[9px] uppercase tracking-widest rounded-full border ${
                    booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-accent-gold/10 text-accent-gold border-accent-gold/20'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-white/30 uppercase tracking-wider mb-1">Dates</p>
                    <p className="text-white/80">{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-white/30 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-white/80">₹{Number(booking.total_price).toLocaleString()}</p>
                  </div>
                </div>

                {booking.status !== 'cancelled' && (
                  <div className="pt-4 border-t border-white/5 mt-4">
                    <form action={cancelBooking.bind(null, booking.id)}>
                      <button type="submit" className="text-[10px] font-semibold tracking-wider uppercase text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition-colors">
                        Cancel Booking
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Guest Verification Status */}
              <div className="w-full lg:w-2/3 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4">Guest Verification Protocol</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booking.booking_guests?.map((guest: any) => (
                    <div key={guest.id} className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
                          {guest.guest_index === 0 ? 'Main Guest' : `Guest ${guest.guest_index + 1}`}
                        </p>
                        <p className="text-white text-sm">{guest.name || 'Awaiting Upload'}</p>
                        {guest.guest_profiles && (
                          <p className="text-white/40 text-[10px] mt-1 font-mono">ID: {guest.guest_profiles.document_number}</p>
                        )}
                      </div>
                      
                      <div>
                        {guest.verification_status === 'verified' ? (
                          <div className="flex items-center gap-1 text-green-400 text-xs uppercase tracking-wider bg-green-500/10 px-2 py-1 rounded-md">
                            <CheckCircle className="w-3 h-3" /> OK
                          </div>
                        ) : guest.verification_status === 'failed' ? (
                          <div className="flex items-center gap-1 text-red-400 text-xs uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded-md">
                            <ShieldAlert className="w-3 h-3" /> FAILED
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-accent-gold text-xs uppercase tracking-wider bg-accent-gold/10 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3" /> PEND
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-20 text-white/40 bg-white/[0.01] rounded-2xl border border-white/5">
              No bookings found in the system.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
