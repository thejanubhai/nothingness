import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar as CalendarIcon, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import CancelBookingButton from '@/components/CancelBookingButton';

export const metadata: Metadata = {
  title: 'Overview | Guest Portal',
};

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // 1. Fetch upcoming bookings (check_in >= today or pending)
  const today = new Date().toISOString().split('T')[0];
  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      spaces ( title, city, featured_image )
    `)
    .eq('user_id', user.id)
    .gte('check_in', today)
    .order('check_in', { ascending: true })
    .limit(3);

  // 2. Fetch Identity Profile
  const { data: profile } = await supabase
    .from('guest_profiles')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  // Calculate Days Left for ID Deletion
  let daysLeft = 0;
  if (profile?.is_verified && profile.created_at) {
    const verifiedDate = new Date(profile.created_at);
    const deletionDate = new Date(verifiedDate.getTime() + 180 * 24 * 60 * 60 * 1000);
    const timeDiff = deletionDate.getTime() - new Date().getTime();
    daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (daysLeft < 0) daysLeft = 0;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-2">Welcome Back</p>
        <h1 className="font-serif text-3xl md:text-4xl">{user.phone}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* NEW BOOKING WIDGET */}
        <div className="relative overflow-hidden bg-gradient-to-br from-accent-gold/10 to-transparent border border-accent-gold/20 rounded-3xl p-8 flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-150" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-accent-gold/20 rounded-2xl flex items-center justify-center mb-6 border border-accent-gold/30">
              <CalendarIcon className="w-6 h-6 text-accent-gold" />
            </div>
            <h2 className="font-serif text-2xl text-white mb-2">Book Your Next Escape</h2>
            <p className="text-white/60 text-sm mb-8 max-w-sm">
              Ready to disappear? Reserve The Chamber for your next private getaway.
            </p>
          </div>
          
          <Link 
            href="/booking"
            className="relative z-10 inline-flex items-center justify-between bg-white text-black px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent-gold transition-colors"
          >
            Start Booking
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ID VERIFICATION & PRIVACY WIDGET */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-white flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${profile?.is_verified ? 'text-green-400' : 'text-white/30'}`} />
                Identity Status
              </h2>
              {profile?.is_verified && (
                <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  Verified
                </span>
              )}
            </div>
            
            {profile?.is_verified ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Document Type</p>
                    <p className="text-white">{profile.id_document_type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Name</p>
                    <p className="text-white truncate">{profile.full_name}</p>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent-gold" />
                  <div className="flex items-start gap-4">
                    <Clock className="w-5 h-5 text-accent-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white mb-1">Automatic Deletion in {daysLeft} Days</p>
                      <p className="text-xs text-white/50 leading-relaxed">
                        To protect your privacy, your personally identifiable data (PII) is automatically purged from our servers 180 days after verification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-white/40 text-sm mb-4">No verified identity found.</p>
                <p className="text-[11px] text-accent-gold">Your ID will be securely verified during your first booking.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* UPCOMING BOOKINGS WIDGET */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-white">Upcoming Bookings</h2>
          <Link href="/dashboard/bookings" className="text-xs text-accent-gold hover:text-white uppercase tracking-widest transition-colors">
            View All
          </Link>
        </div>

        {upcomingBookings && upcomingBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingBookings.map((booking: any) => (
              <div key={booking.id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden group">
                <div className="h-40 relative overflow-hidden">
                  <img 
                    src={booking.spaces.featured_image || '/images/The Void.png'} 
                    alt={booking.spaces.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div>
                      <h3 className="font-serif text-lg text-white leading-tight">{booking.spaces.title}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-white/70">{booking.spaces.city}</p>
                    </div>
                    <div className={`px-2 py-1 rounded border text-[9px] font-bold tracking-widest uppercase ${
                      booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      'bg-accent-gold/20 text-accent-gold border-accent-gold/30'
                    }`}>
                      {booking.status}
                    </div>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4 text-xs mb-5">
                    <div>
                      <p className="text-white/30 uppercase tracking-widest mb-1">Check In</p>
                      <p className="text-white/90">{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-white/30 uppercase tracking-widest mb-1">Check Out</p>
                      <p className="text-white/90">{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {booking.status === 'pending' ? (
                      <Link 
                        href={`/booking/${booking.id}/verify`}
                        className="flex-1 text-center text-[10px] font-bold tracking-[0.1em] uppercase text-black bg-accent-gold px-3 py-2.5 rounded-lg hover:bg-white transition-colors"
                      >
                        Verify ID
                      </Link>
                    ) : (
                      <Link 
                        href={`/booking/${booking.id}/success`}
                        className="flex-1 text-center text-[10px] font-bold tracking-[0.1em] uppercase text-accent-gold border border-accent-gold/30 px-3 py-2.5 rounded-lg hover:bg-accent-gold/10 transition-colors"
                      >
                        Access Code
                      </Link>
                    )}
                    <CancelBookingButton bookingId={booking.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-white/5 rounded-3xl bg-white/[0.01]">
            <p className="text-white/40 text-sm mb-4">You have no upcoming stays.</p>
            <Link href="/booking" className="text-xs text-accent-gold hover:text-white uppercase tracking-widest transition-colors underline underline-offset-4">
              Book a Space
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
