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
      const { data } = await supabase.from('spaces').select('id, title').eq('active', true);
      if (data) setSpaces(data);
    };
    fetchSpaces();
  }, []);

  const [formData, setFormData] = useState({
    space_id: '',
    check_in: '',
    check_out: '',
    guests: 2,
    total_price: 0,
    status: 'confirmed',
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
      const supabase = createClient();
      
      const { data: booking, error: insertError } = await supabase
        .from('bookings')
        .insert({
          space_id: formData.space_id,
          check_in: formData.check_in,
          check_out: formData.check_out,
          guests: formData.guests,
          total_price: formData.total_price,
          status: formData.status,
          guest_name: formData.guest_name,
          guest_email: formData.guest_email,
          guest_phone: formData.guest_phone,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      // Add the primary guest to booking_guests
      if (booking) {
        await supabase.from('booking_guests').insert({
          booking_id: booking.id,
          guest_index: 0,
          name: formData.guest_name,
          verification_status: 'pending'
        });
      }

      toast.success('Booking added successfully!');
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
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/bookings" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl mb-1 text-white">Add Booking</h1>
            <p className="text-white/50 text-sm tracking-wide">Manually create a reservation.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading || !formData.space_id || !formData.check_in || !formData.check_out}
          className="flex items-center gap-2 bg-accent-gold text-black px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Booking'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <CalendarDays className="w-5 h-5 text-accent-gold" />
            <h2 className="font-serif text-xl text-white">Booking Details</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Select Space</label>
              <select 
                required
                value={formData.space_id}
                onChange={(e) => setFormData({...formData, space_id: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              >
                <option value="" className="bg-black text-white" disabled>Select a space...</option>
                {spaces.map(space => (
                  <option key={space.id} value={space.id} className="bg-black text-white">
                    {space.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Check In Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.check_in}
                  onChange={(e) => setFormData({...formData, check_in: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Check Out Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.check_out}
                  onChange={(e) => setFormData({...formData, check_out: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Total Guests</label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={formData.guests}
                  onChange={(e) => setFormData({...formData, guests: Number(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Total Price (₹)</label>
                <input 
                  required
                  type="number"
                  min="0"
                  value={formData.total_price}
                  onChange={(e) => setFormData({...formData, total_price: Number(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                >
                  <option value="pending" className="bg-black text-white">Pending</option>
                  <option value="confirmed" className="bg-black text-white">Confirmed</option>
                  <option value="cancelled" className="bg-black text-white">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 space-y-6">
              <h3 className="font-serif text-lg text-white">Guest Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Primary Guest Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.guest_name}
                    onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Email (Optional)</label>
                  <input 
                    type="email" 
                    value={formData.guest_email}
                    onChange={(e) => setFormData({...formData, guest_email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Phone (Optional)</label>
                  <input 
                    type="tel" 
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({...formData, guest_phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                    placeholder="+91..."
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
