import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { DollarSign, TrendingUp, CreditCard } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminFinancials() {
  const supabase = await createClient();
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, created_at, check_in, check_out, total_price, payment_status, status, transaction_id, payment_order_id,
      properties (title)
    `)
    .order('created_at', { ascending: false });

  const totalRevenue = bookings ? bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + Number(b.total_price), 0) : 0;
  const pendingRevenue = bookings ? bookings.filter(b => b.payment_status === 'pending' && b.status !== 'cancelled').reduce((sum, b) => sum + Number(b.total_price), 0) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Financials</h1>
        <p className="text-white/50 text-sm tracking-wide">Revenue tracking and transaction history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">Total Revenue</p>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <h2 className="font-serif text-3xl text-white">₹{totalRevenue.toLocaleString()}</h2>
        </div>
        
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">Pending Payments</p>
            <DollarSign className="w-4 h-4 text-accent-gold" />
          </div>
          <h2 className="font-serif text-3xl text-white">₹{pendingRevenue.toLocaleString()}</h2>
        </div>
        
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">Processed Transactions</p>
            <CreditCard className="w-4 h-4 text-white/60" />
          </div>
          <h2 className="font-serif text-3xl text-white">{bookings?.filter(b => b.payment_status === 'paid').length || 0}</h2>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-white/10">
          <h3 className="font-serif text-xl text-white">Transaction History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.01] border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Booking REF</th>
                <th className="px-6 py-4 font-medium">Property</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings?.map((booking: any) => (
                <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-white/60">
                    {format(new Date(booking.created_at), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-white/80">{booking.id.split('-')[0]}</span>
                  </td>
                  <td className="px-6 py-4 text-white">
                    {booking.properties?.title}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    ₹{Number(booking.total_price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs uppercase tracking-widest border ${
                      booking.payment_status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      booking.payment_status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-accent-gold/10 text-accent-gold border-accent-gold/20'
                    }`}>
                      {booking.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-white/40 truncate max-w-[150px]">
                      {booking.transaction_id || '-'}
                    </p>
                  </td>
                </tr>
              ))}
              
              {(!bookings || bookings.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/30">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
