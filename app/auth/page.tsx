'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      toast.error('Failed to send magic link', { description: error.message });
    } else {
      setSent(true);
      toast.success('Magic link sent!', { description: 'Check your email for the login link.' });
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-12 text-center"
      >
        <div className="w-16 h-16 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent-gold/20">
          <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl mb-4 text-white">Guest Portal</h1>
        <p className="text-white/50 text-sm mb-8">Sign in to view your upcoming bookings and manage your profile.</p>

        {!sent ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-accent-gold text-black py-4 rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        ) : (
          <div className="text-center p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
            <p className="text-green-400 mb-2 font-medium">Link Sent!</p>
            <p className="text-white/50 text-sm">We've sent a magic login link to {email}. Please check your inbox.</p>
          </div>
        )}
      </motion.div>
    </main>
  );
}
