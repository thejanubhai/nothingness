import Link from 'next/link';

// Mock data for UI demonstration
const mockBookings = [
  {
    id: "bkg_10294",
    property: "The Concrete Villa",
    checkIn: "Oct 12, 2026",
    checkOut: "Oct 15, 2026",
    status: "Confirmed",
    amount: "$3,750"
  },
  {
    id: "bkg_09823",
    property: "Underground Art Loft",
    checkIn: "Dec 05, 2026",
    checkOut: "Dec 10, 2026",
    status: "Pending",
    amount: "$4,400"
  }
];

export default async function DashboardPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 border-b border-border-subtle pb-10">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">Your Sanctuaries</h1>
          <p className="text-foreground/70 font-sans tracking-wide">Manage your upcoming escapes and past experiences.</p>
        </div>
        <Link href="/auth/login" className="text-sm text-foreground/50 hover:text-foreground uppercase tracking-widest transition-colors mt-6 md:mt-0">
          Sign Out
        </Link>
      </div>

      <div className="space-y-6">
        {mockBookings.map((booking) => (
          <div key={booking.id} className="bg-surface-blur border border-border-subtle p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-accent-muted mb-2">Booking #{booking.id}</p>
              <h3 className="font-serif text-2xl mb-1">{booking.property}</h3>
              <p className="text-foreground/60">{booking.checkIn} — {booking.checkOut}</p>
            </div>
            
            <div className="flex flex-col md:items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-widest ${
                booking.status === 'Confirmed' ? 'bg-accent-gold/10 text-accent-gold' : 'bg-foreground/10 text-foreground/70'
              }`}>
                {booking.status}
              </span>
              <p className="font-sans text-xl">{booking.amount}</p>
            </div>
          </div>
        ))}
        
        {mockBookings.length === 0 && (
          <div className="text-center py-20 border border-dashed border-border-subtle rounded-xl">
            <p className="text-foreground/50 mb-6">You have no upcoming stays.</p>
            <Link href="/properties" className="bg-foreground text-background px-8 py-3 rounded-full font-medium transition-opacity hover:opacity-90">
              Explore Properties
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
