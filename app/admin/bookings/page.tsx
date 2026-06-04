import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Filter } from "lucide-react";
import CancelBookingButton from "@/components/CancelBookingButton";
import CsvExportButton from "@/components/CsvExportButton";
import { CheckCircle, Clock, ShieldAlert, Plus } from "lucide-react";
import ComingSoonButton from "@/components/ComingSoonButton";

export const dynamic = 'force-dynamic';

export default async function AdminBookings() {
  const supabase = await createClient();
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      spaces (title),
      booking_guests (
        id, name, verification_status, guest_index, 
        guest_profiles (document_number, full_name, is_verified)
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Bookings</h1>
          <p className="text-white/50 text-sm tracking-wide">Monitor reservations and guest verifications.</p>
        </div>
        <div className="flex items-center gap-4">
          <CsvExportButton data={bookings || []} filename="bookings.csv" />
          <button className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <ComingSoonButton text="Add Booking" icon={<Plus className="w-4 h-4" />} />
        </div>
      </div>

      <div className="space-y-6">
        {bookings?.map((booking) => (
          <div key={booking.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col lg:flex-row gap-8">
            
            {/* Booking Info */}
            <div className="w-full lg:w-1/3 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-accent-gold uppercase tracking-widest mb-1">REF: {booking.id.split('-')[0]}</p>
                  <h4 className="text-xl text-white">{booking.spaces?.title}</h4>
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
                  <p className="text-white/80">
                    {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd')}
                  </p>
                </div>
                <div>
                  <p className="text-white/30 uppercase tracking-wider mb-1">Total</p>
                  <p className="text-white/80">₹{Number(booking.total_price).toLocaleString()}</p>
                </div>
              </div>

              {booking.status !== 'cancelled' && (
                <div className="pt-4 border-t border-white/5 mt-4">
                  <CancelBookingButton variant="admin" bookingId={booking.id} />
                </div>
              )}
            </div>

            {/* Guest Verification Status */}
            <div className="w-full lg:w-2/3 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4">Guest Protocol</p>
              
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
                        <div className="flex items-center gap-1 text-green-400 text-xs uppercase tracking-wider bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                          <CheckCircle className="w-3 h-3" /> OK
                        </div>
                      ) : guest.verification_status === 'failed' ? (
                        <div className="flex items-center gap-1 text-red-400 text-xs uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                          <ShieldAlert className="w-3 h-3" /> FAILED
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-accent-gold text-xs uppercase tracking-wider bg-accent-gold/10 px-2 py-1 rounded-md border border-accent-gold/20">
                          <Clock className="w-3 h-3" /> PEND
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!booking.booking_guests || booking.booking_guests.length === 0) && (
                  <div className="text-white/30 text-sm py-4">No guests registered yet.</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
