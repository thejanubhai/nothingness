'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, Sparkles, TrendingUp, ShieldCheck, ArrowRight, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PartnerOnboardingBanner() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading || !user) {
    return null;
  }

  const displayPhone = user.phone || (user.email?.includes('@auth.nothingness') ? `+${user.email.split('@')[0]}` : user.email || 'Verified Guest');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mb-8"
    >
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-accent-gold/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-gold/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-mono uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Level 2 Ecosystem • Fast-Track Partner Host Onboarding</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-serif text-white font-bold leading-tight">
              Welcome, <span className="text-accent-gold font-mono">{displayPhone}</span>
            </h2>
            
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              As an authenticated Nothingness guest, you have <strong className="text-white">priority access</strong> to list your residential apartment or villa under our 70/30 revenue-sharing model with turnkey setup, statutory Police Compliance, and discreet contactless guest access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Link
              href="/partner"
              className="flex-1 sm:flex-initial px-5 py-3.5 bg-accent-gold hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Partner Command</span>
            </Link>

            <a
              href="#apply-section"
              className="flex-1 sm:flex-initial px-5 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/15 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Submit Property</span>
              <ArrowRight className="w-4 h-4 text-accent-gold" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
