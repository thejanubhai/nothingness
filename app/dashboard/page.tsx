import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogOut, User as UserIcon, BookOpen } from 'lucide-react';

import CancelBookingButton from '@/components/CancelBookingButton';
import { signOut } from '@/app/actions/auth';
import GuestVerificationList from '@/components/GuestVerificationList';

export const metadata: Metadata = {
  title: 'Guest Portal | Nothingness',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth');
  }
  
  // Fetch real bookings for this authenticated user
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      properties (
        title,
        featured_image,
        city
      ),
      booking_guests (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch their guest profile if they have verified one
  const { data: profile } = await supabase
    .from('guest_profiles')
    .select('*')
    // We would match on phone number or email if we had it, but for demo we will just get one or none
    .limit(1)
    .single();

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 border-b border-white/10 pb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4 flex items-center gap-2">
            <UserIcon className="w-3 h-3" /> Welcome Back
          </p>
          <h1 className="font-serif text-4xl md:text-5xl">{user.email?.split('@')[0] || 'Guest'}</h1>
        </div>
        
        <form action={signOut}>
          <button type="submit" className="text-xs uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-2 transition-colors cursor-pointer">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h3 className="font-serif text-2xl mb-4 text-white">Identity Profile</h3>
            {profile ? (
              <div className="space-y-4 text-sm text-white/70">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Full Name</p>
                  <p>{profile.full_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Document Type</p>
                  <p>{profile.id_document_type}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Status</p>
                  <span className="text-green-400 bg-green-500/10 px-2 py-1 rounded-md">Verified</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-white/40 text-sm mb-4">No verified identity found.</p>
                <p className="text-[11px] text-accent-gold">Identities are automatically built when you verify during a booking.</p>
              </div>
            )}
          </div>
          
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h3 className="font-serif text-xl mb-4 text-white">Quick Actions</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contact" className="text-white/50 hover:text-white transition-colors flex items-center gap-2">
                  Contact Concierge
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-white/50 hover:text-white transition-colors flex items-center gap-2">
                  House Rules & Policies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bookings Feed */}
        <div className="lg:col-span-2">
          <h2 className="font-serif text-3xl mb-6 text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-accent-gold" /> Your Bookings
          </h2>
          
          {bookings && bookings.length > 0 ? (
            <div className="space-y-6">
              {bookings.map((booking: any) => (
                <div key={booking.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-40 aspect-video md:aspect-square relative rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <img 
                      src={booking.properties.featured_image || '/images/property-1.png'} 
                      alt={booking.properties.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-grow space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-serif text-xl text-white mb-1">{booking.properties.title}</h3>
                        <p className="text-white/40 text-[11px] uppercase tracking-widest">{booking.properties.city}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase ${
                        booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-accent-gold/10 text-accent-gold border border-accent-gold/20'
                      }`}>
                        {booking.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm border-y border-white/5 py-3 my-3">
                      <div>
                        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Check In</p>
                        <p className="text-white/80">{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div>
                        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Check Out</p>
                        <p className="text-white/80">{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {booking.status === 'pending' && (
                        <Link 
                          href={`/booking/${booking.id}/verify`}
                          className="text-[11px] font-semibold tracking-[0.1em] uppercase text-black bg-accent-gold px-4 py-2 rounded-lg hover:bg-white transition-colors"
                        >
                          Complete Verification
                        </Link>
                      )}
                      
                      {booking.status === 'confirmed' && (
                        <Link 
                          href={`/booking/${booking.id}/success`}
                          className="text-[11px] font-semibold tracking-[0.1em] uppercase text-accent-gold border border-accent-gold/30 px-4 py-2 rounded-lg hover:bg-accent-gold/10 transition-colors"
                        >
                          View Access Code
                        </Link>
                      )}

                      {booking.status !== 'cancelled' && (
                        <CancelBookingButton bookingId={booking.id} />
                      )}
                    </div>
                    
                    <GuestVerificationList guests={booking.booking_guests} siteUrl={process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/[0.01]">
              <p className="text-white/40 mb-6">You have no reservations on record.</p>
              <Link href="/" className="inline-block border border-accent-gold/50 text-accent-gold px-8 py-3 rounded-xl text-[12px] font-semibold tracking-[0.15em] uppercase hover:bg-accent-gold hover:text-black transition-all duration-300">
                Explore Properties
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
