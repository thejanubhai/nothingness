'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AddGuestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    id_document_type: 'Aadhaar',
    document_number: '',
    is_verified: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { error: insertError } = await supabase
        .from('guest_profiles')
        .insert({
          full_name: formData.full_name,
          phone_number: formData.phone_number || null, // send null if empty to avoid unique constraint issues
          id_document_type: formData.id_document_type,
          document_number: formData.document_number || null,
          is_verified: formData.is_verified,
        });

      if (insertError) throw insertError;
      
      toast.success('Guest added successfully!');
      router.push('/admin/guests');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add guest');
      toast.error('Failed to add guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/guests" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl mb-1 text-white">Add Guest</h1>
            <p className="text-white/50 text-sm tracking-wide">Manually register a new guest profile.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading || !formData.full_name}
          className="flex items-center gap-2 bg-accent-gold text-black px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Guest'}
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
            <UserPlus className="w-5 h-5 text-accent-gold" />
            <h2 className="font-serif text-xl text-white">Guest Information</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Full Name</label>
              <input 
                required
                type="text" 
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                placeholder="e.g., John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                placeholder="+91..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">ID Document Type</label>
                <select 
                  value={formData.id_document_type}
                  onChange={(e) => setFormData({...formData, id_document_type: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                >
                  <option value="Aadhaar" className="bg-black text-white">Aadhaar</option>
                  <option value="Passport" className="bg-black text-white">Passport</option>
                  <option value="Driving License" className="bg-black text-white">Driving License</option>
                  <option value="None" className="bg-black text-white">None</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Document Number</label>
                <input 
                  type="text" 
                  value={formData.document_number}
                  onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  placeholder="e.g., 1234 5678 9012"
                />
              </div>
            </div>
            
            <div className="flex items-center pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.is_verified}
                  onChange={(e) => setFormData({...formData, is_verified: e.target.checked})}
                  className="w-4 h-4 rounded border-white/10 text-accent-gold focus:ring-accent-gold bg-transparent"
                />
                <span className="text-sm text-white">Guest is Verified (ID checked)</span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
