import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import CancelBookingButton from '@/components/CancelBookingButton';
import GuestVerificationList from '@/components/GuestVerificationList';

export const metadata: Metadata = {
  title: 'My Bookings | Guest Portal',
};

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
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
          {bookings.map((booking: any) => (
            <div key={booking.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-48 aspect-[4/3] relative rounded-2xl overflow-hidden shrink-0 border border-white/10">
                <img 
                  src={booking.spaces.featured_image || '/images/The Void.png'} 
                  alt={booking.spaces.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-grow space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-2xl text-white mb-1">{booking.spaces.title}</h3>
                    <p className="text-white/40 text-xs uppercase tracking-widest">{booking.spaces.city}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                    booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-accent-gold/10 text-accent-gold border border-accent-gold/20'
                  }`}>
                    {booking.status}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-y border-white/5 py-4">
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Check In</p>
                    <p className="text-white/90 font-medium">{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Check Out</p>
                    <p className="text-white/90 font-medium">{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-white/90 font-medium">₹{booking.total_price.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Reference ID</p>
                    <p className="text-white/90 font-mono text-xs">{booking.id.split('-')[0]}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {booking.status === 'pending' && (
                    <Link 
                      href={`/booking/${booking.id}/verify`}
                      className="text-[11px] font-bold tracking-[0.1em] uppercase text-black bg-accent-gold px-5 py-2.5 rounded-xl hover:bg-white transition-colors"
                    >
                      Complete Verification
                    </Link>
                  )}
                  
                  {booking.status === 'confirmed' && (
                    <Link 
                      href={`/booking/${booking.id}/success`}
                      className="text-[11px] font-bold tracking-[0.1em] uppercase text-accent-gold border border-accent-gold/30 px-5 py-2.5 rounded-xl hover:bg-accent-gold/10 transition-colors"
                    >
                      View Access Code
                    </Link>
                  )}

                  {booking.status !== 'cancelled' && (
                    <CancelBookingButton bookingId={booking.id} />
                  )}
                </div>
                
                <div className="pt-4">
                  <GuestVerificationList guests={booking.booking_guests} siteUrl={process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.01]">
          <p className="text-white/40 mb-6">You have no reservations on record.</p>
          <Link href="/booking" className="inline-block border border-accent-gold/50 text-accent-gold px-8 py-4 rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-accent-gold hover:text-black transition-all duration-300">
            Explore Spaces
          </Link>
        </div>
      )}
    </div>
  );
}
