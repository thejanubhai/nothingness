import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import CancelBookingButton from '@/components/CancelBookingButton';
import GuestVerificationList from '@/components/GuestVerificationList';
import CloudinaryImage from '@/components/CloudinaryImage';

export const metadata: Metadata = {
  title: 'My Bookings | Guest Portal',
};

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth?redirect=/dashboard/bookings');
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      spaces ( title, featured_image, city ),
      booking_guests (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl text-white mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-accent-gold" />
          Booking History
        </h1>
        <p className="text-white/50 text-sm">Review your past stays and manage upcoming reservations.</p>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((booking: any) => {
            const space = Array.isArray(booking.spaces) ? booking.spaces[0] : booking.spaces;
            const isCancelled = booking.status === 'cancelled';
            const isConfirmed = booking.status === 'confirmed';
            const isPending = booking.status === 'pending';

            return (
              <div 
                key={booking.id} 
                className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700/80 rounded-3xl p-5 sm:p-6 lg:p-7 flex flex-col md:flex-row items-start gap-6 lg:gap-8 transition-all shadow-xl"
              >
                {/* Sanctuary Room Thumbnail - Cinematic Wide Aspect Ratio (NEVER Stretched!) */}
                <div className="w-full md:w-80 lg:w-96 aspect-[16/10] relative rounded-2xl overflow-hidden shrink-0 self-start border border-zinc-800 bg-zinc-900 shadow-md group">
                  <CloudinaryImage 
                    src={space?.featured_image || ''} 
                    alt={space?.title || 'Sanctuary'}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    transformOptions={{ width: 800, height: 500, crop: 'fill', quality: 'auto' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                      {space?.city || 'Sanctuary'}
                    </span>
                  </div>
                </div>
                
                {/* Stay Details & Management */}
                <div className="flex-grow w-full space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-2xl lg:text-3xl text-white font-bold mb-1">
                        {space?.title || 'Sanctuary Stay'}
                      </h3>
                      <p className="text-zinc-400 text-xs uppercase font-mono tracking-widest">
                        {space?.area ? `${space.area}, ${space.city}` : space?.city || 'Private Sanctuary'}
                      </p>
                    </div>
                    <span className={`self-start px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase ${
                      isConfirmed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      isCancelled ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                      'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80">
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider mb-1">Check In</p>
                      <p className="text-white font-medium text-xs sm:text-sm">{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider mb-1">Check Out</p>
                      <p className="text-white font-medium text-xs sm:text-sm">{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider mb-1">Total Amount</p>
                      <p className="text-white font-medium text-xs sm:text-sm">₹{booking.total_price ? Number(booking.total_price).toLocaleString('en-IN') : '0'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider mb-1">Reference ID</p>
                      <p className="text-accent-gold font-mono text-xs font-semibold">{booking.id.split('-')[0].toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {isPending && (
                      <Link 
                        href={`/booking/${booking.id}/verify`}
                        className="text-[11px] font-bold tracking-[0.1em] uppercase text-black bg-amber-400 hover:bg-white px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                      >
                        Complete Verification
                      </Link>
                    )}
                    
                    {isConfirmed && (
                      <Link 
                        href={`/booking/${booking.id}/success`}
                        className="text-[11px] font-bold tracking-[0.1em] uppercase text-black bg-accent-gold hover:bg-white px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                      >
                        Arrival &amp; Secret Key
                      </Link>
                    )}

                    {!isCancelled && (
                      <CancelBookingButton bookingId={booking.id} bookingTitle={space?.title} />
                    )}

                    {isCancelled && (
                      <div className="w-full p-3.5 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-mono text-[11px]">Reservation Cancelled • Date locks on Airbnb &amp; MMT released</span>
                        <Link href="/spaces" className="text-accent-gold hover:text-white font-mono text-[11px] underline">
                          Rebook Another Stay →
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  {/* Co-Guest Verification Roster (Only for active bookings) */}
                  {!isCancelled && booking.booking_guests && booking.booking_guests.length > 0 && (
                    <GuestVerificationList 
                      guests={booking.booking_guests} 
                      siteUrl={process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia'} 
                      bookingId={booking.id}
                      isAdmin={false}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.01]">
          <p className="text-white/40 mb-6">You have no reservations on record.</p>
          <Link href="/spaces" className="inline-block border border-accent-gold/50 text-accent-gold px-8 py-4 rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-accent-gold hover:text-black transition-all duration-300">
            Explore Sanctuaries
          </Link>
        </div>
      )}
    </div>
  );
}
