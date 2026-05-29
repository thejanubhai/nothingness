import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Guest Dashboard | Nothingness',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // For a real app, this would use auth.getUser()
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return redirect('/login');
  
  // Simulating fetching a guest's bookings (mocking user for now, or just fetching all for demo)
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      properties (
        title,
        featured_image,
        city
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-6xl mx-auto">
      <div className="mb-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Guest Portal</p>
        <h1 className="font-serif text-4xl md:text-5xl">Your Sanctuaries</h1>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-8">
          {bookings.map((booking: any) => (
            <div key={booking.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="w-full md:w-48 aspect-video md:aspect-square relative rounded-xl overflow-hidden shrink-0 border border-white/5">
                <img 
                  src={booking.properties.featured_image || '/images/property-1.png'} 
                  alt={booking.properties.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-grow space-y-4">
                <div>
                  <h3 className="font-serif text-2xl text-white mb-1">{booking.properties.title}</h3>
                  <p className="text-white/50 text-sm">{booking.properties.city}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Check In</p>
                    <p className="text-white/80">{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Check Out</p>
                    <p className="text-white/80">{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-auto shrink-0 flex flex-col items-start md:items-end gap-4">
                <div className={`px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase ${
                  booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  'bg-accent-gold/10 text-accent-gold border border-accent-gold/20'
                }`}>
                  {booking.status}
                </div>
                
                {booking.status === 'confirmed' && (
                  <Link href="/contact" className="text-sm text-white/50 hover:text-white underline underline-offset-4 transition-colors">
                    Request Concierge
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 border border-white/5 rounded-3xl bg-white/[0.01]">
          <p className="text-white/40 mb-6">You have no upcoming reservations.</p>
          <Link href="/" className="inline-block border border-accent-gold/50 text-accent-gold px-8 py-3 rounded-full text-[13px] font-semibold tracking-[0.15em] uppercase hover:bg-accent-gold hover:text-black transition-all duration-300">
            Explore Properties
          </Link>
        </div>
      )}
    </main>
  );
}
