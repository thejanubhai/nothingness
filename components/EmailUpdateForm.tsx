'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

export default function EmailUpdateForm({ initialEmail }: { initialEmail: string | undefined }) {
  const [email, setEmail] = useState(initialEmail || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Email updated! Check your inbox for a confirmation link.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent-gold/10 rounded-xl flex items-center justify-center border border-accent-gold/20">
          <Mail className="w-5 h-5 text-accent-gold" />
        </div>
        <div>
          <h2 className="font-serif text-xl text-white">Communication Settings</h2>
          <p className="text-white/40 text-xs mt-1">Required for iCal calendar invites and booking receipts.</p>
        </div>
      </div>

      <form onSubmit={handleUpdateEmail} className="flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:flex-1">
          <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Email Address</label>
          <input 
            type="email" 
            placeholder="you@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading || email === initialEmail}
          className="w-full md:w-auto bg-accent-gold text-black px-8 py-4 rounded-xl text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Saving...' : 'Save Email'}
        </button>
      </form>
    </div>
  );
}
