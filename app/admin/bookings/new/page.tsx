'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AddBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<any[]>([]);

  useEffect(() => {
    const fetchSpaces = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('spaces').select('id, title, nightly_price').eq('active', true);
      if (data) setSpaces(data);
    };
    fetchSpaces();
  }, []);

  const [formData, setFormData] = useState({
    space_id: '',
    check_in: '',
    check_out: '',
    guests: 2,
    total_price: 15000,
    status: 'confirmed',
    payment_method: 'UPI',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.space_id) {
      setError("Please select a space");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create reservation');
      }

      toast.success('Reservation registered successfully!');
      router.push('/admin/bookings');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add booking');
      toast.error('Failed to add booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/bookings" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white border border-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl mb-1 text-white">Add Reservation</h1>
            <p className="text-white/50 text-xs md:text-sm tracking-wide">Manually record a direct booking with payment mode.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading || !formData.space_id || !formData.check_in || !formData.check_out || !formData.guest_name}
          className="flex items-center gap-2 bg-accent-gold text-black px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-xl disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Booking'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <CalendarDays className="w-5 h-5 text-accent-gold" />
            <h2 className="font-serif text-xl text-white">Booking Details</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Select Sanctuary</label>
              <select 
                required
                value={formData.space_id}
                onChange={(e) => setFormData({...formData, space_id: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold"
              >
                <option value="" className="bg-black text-white" disabled>Select a sanctuary space...</option>
                {spaces.map(space => (
                  <option key={space.id} value={space.id} className="bg-black text-white">
                    {space.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Check In Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.check_in}
                  onChange={(e) => setFormData({...formData, check_in: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Check Out Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.check_out}
                  onChange={(e) => setFormData({...formData, check_out: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Total Guests</label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={formData.guests}
                  onChange={(e) => setFormData({...formData, guests: Number(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Total Price (₹)</label>
                <input 
                  required
                  type="number"
                  min="0"
                  value={formData.total_price}
                  onChange={(e) => setFormData({...formData, total_price: Number(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Payment Mode (Item 11)</label>
                <select 
                  value={formData.payment_method}
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold font-mono font-bold text-accent-gold"
                >
                  <option value="UPI" className="bg-black text-white">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash" className="bg-black text-white">Direct Cash</option>
                  <option value="PayU" className="bg-black text-white">PayU Online Gateway</option>
                  <option value="Airbnb Payout" className="bg-black text-white">Airbnb Payout</option>
                  <option value="MakeMyTrip Payout" className="bg-black text-white">MakeMyTrip Payout</option>
                  <option value="Bank Transfer" className="bg-black text-white">Direct Bank NEFT/IMPS</option>
                </select>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 space-y-6">
              <h3 className="font-serif text-lg text-white">Guest Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Primary Guest Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.guest_name}
                    onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold font-medium"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Phone (For WhatsApp ID Link)</label>
                  <input 
                    type="tel" 
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({...formData, guest_phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold font-mono"
                    placeholder="+91..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Email (Optional)</label>
                  <input 
                    type="email" 
                    value={formData.guest_email}
                    onChange={(e) => setFormData({...formData, guest_email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </form>
    </div>
  );
}
