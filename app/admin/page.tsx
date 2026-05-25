// Mock Admin Data
const stats = [
  { label: "Total Revenue", value: "$124,500" },
  { label: "Active Bookings", value: "32" },
  { label: "Occupancy Rate", value: "78%" }
];

export default async function AdminPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16 border-b border-border-subtle pb-10">
        <h1 className="font-serif text-4xl md:text-5xl mb-4 text-accent-gold">System Overview</h1>
        <p className="text-foreground/70 font-sans tracking-wide">Command center for Nothingness properties and experiences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface-blur border border-border-subtle p-8 rounded-xl">
            <p className="text-xs uppercase tracking-widest text-accent-muted mb-4">{stat.label}</p>
            <h2 className="font-serif text-4xl">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-serif text-2xl mb-8 border-b border-border-subtle pb-4">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="py-4 text-xs uppercase tracking-widest text-foreground/50 font-normal">Guest</th>
                <th className="py-4 text-xs uppercase tracking-widest text-foreground/50 font-normal">Property</th>
                <th className="py-4 text-xs uppercase tracking-widest text-foreground/50 font-normal">Dates</th>
                <th className="py-4 text-xs uppercase tracking-widest text-foreground/50 font-normal">Amount</th>
                <th className="py-4 text-xs uppercase tracking-widest text-foreground/50 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Mock Row */}
              <tr className="border-b border-border-subtle/50 hover:bg-white/5 transition-colors">
                <td className="py-4 text-foreground/90">A. Azad</td>
                <td className="py-4 text-foreground/70">The Concrete Villa</td>
                <td className="py-4 text-foreground/70 text-sm">Oct 12 - Oct 15</td>
                <td className="py-4 text-accent-gold font-medium">$3,750</td>
                <td className="py-4">
                  <span className="px-2 py-1 bg-accent-gold/10 text-accent-gold text-xs rounded-full">Confirmed</span>
                </td>
              </tr>
              {/* Mock Row */}
              <tr className="border-b border-border-subtle/50 hover:bg-white/5 transition-colors">
                <td className="py-4 text-foreground/90">E. Vance</td>
                <td className="py-4 text-foreground/70">Underground Art Loft</td>
                <td className="py-4 text-foreground/70 text-sm">Dec 05 - Dec 10</td>
                <td className="py-4 text-accent-gold font-medium">$4,400</td>
                <td className="py-4">
                  <span className="px-2 py-1 bg-foreground/10 text-foreground/70 text-xs rounded-full">Pending</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
