import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  
  // Fetch real bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      properties (
        title
      )
    `)
    .order('created_at', { ascending: false });

  // Calculate real stats
  const totalRevenue = bookings 
    ? bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + Number(b.total_price), 0) 
    : 0;
  
  const activeBookings = bookings 
    ? bookings.filter(b => b.status === 'confirmed').length 
    : 0;

  const stats = [
    { label: "Total Revenue (Paid)", value: `₹${totalRevenue.toLocaleString()}` },
    { label: "Active Bookings", value: activeBookings.toString() },
    { label: "Total Processed", value: bookings ? bookings.length.toString() : "0" }
  ];

  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16 border-b border-border-subtle pb-10">
        <h1 className="font-serif text-4xl md:text-5xl mb-4 text-accent-gold">System Overview</h1>
        <p className="text-foreground/70 font-sans tracking-wide">Command center for Nothingness properties and experiences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-xl backdrop-blur-xl hover:border-accent-gold/20 transition-colors">
            <p className="text-[11px] uppercase tracking-widest text-white/50 mb-4">{stat.label}</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-serif text-2xl mb-8 border-b border-border-subtle pb-4 text-white">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal">Reference</th>
                <th className="py-4 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal">Property</th>
                <th className="py-4 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal">Dates</th>
                <th className="py-4 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal">Amount</th>
                <th className="py-4 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings && bookings.length > 0 ? bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 text-white/90 text-sm font-mono uppercase">
                    {booking.id.split('-')[0]}
                  </td>
                  <td className="py-5 text-white/70 text-sm">
                    {booking.properties?.title || 'Unknown Property'}
                  </td>
                  <td className="py-5 text-white/70 text-sm">
                    {new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-5 text-accent-gold text-sm font-medium">
                    ₹{Number(booking.total_price).toLocaleString()}
                  </td>
                  <td className="py-5">
                    <span className={`px-3 py-1 text-[10px] uppercase tracking-wider rounded-full border ${
                      booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-accent-gold/10 text-accent-gold border-accent-gold/20'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40">
                    No bookings found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
