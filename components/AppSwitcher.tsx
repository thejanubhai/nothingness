'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid, 
  Building2, 
  Sparkles, 
  Flame, 
  UserCheck, 
  X, 
  ChevronRight, 
  Headphones, 
  ShieldCheck, 
  Key,
  LayoutGrid
} from 'lucide-react';

interface AppItem {
  id: string;
  name: string;
  badge: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderColor: string;
  bgGlow: string;
  isActive: (path: string) => boolean;
}

const apps: AppItem[] = [
  {
    id: 'spaces',
    name: 'Sanctuaries',
    badge: 'Stays',
    subtitle: 'Ultra-discreet luxury suites & private sanctuaries',
    href: '/spaces',
    icon: Building2,
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgGlow: 'bg-amber-500/10',
    isActive: (path) => path.startsWith('/spaces'),
  },
  {
    id: 'events',
    name: 'Sanctuary Pass',
    badge: 'Events ✨',
    subtitle: 'Secret Munches, Noir Masquerades & VIP soirées',
    href: '/sanctuary-pass',
    icon: Sparkles,
    accentColor: 'text-amber-300',
    borderColor: 'border-amber-400/30',
    bgGlow: 'bg-amber-400/10',
    isActive: (path) => path.startsWith('/sanctuary-pass'),
  },
  {
    id: 'lifestyle',
    name: 'The Circle',
    badge: '18+ Circle ✦',
    subtitle: 'Encrypted member social feed & desires under anonymous @aliases',
    href: '/the-circle',
    icon: Flame,
    accentColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgGlow: 'bg-rose-500/10',
    isActive: (path) => path.startsWith('/the-circle') || path.startsWith('/kinksters'),
  },
  {
    id: 'portal',
    name: 'Member Portal',
    badge: 'Vault 🗝️',
    subtitle: 'Secret door codes, 3D Face ID & reservation access',
    href: '/dashboard',
    icon: UserCheck,
    accentColor: 'text-accent-gold',
    borderColor: 'border-accent-gold/30',
    bgGlow: 'bg-accent-gold/10',
    isActive: (path) => path.startsWith('/dashboard') || path.startsWith('/verify'),
  },
  {
    id: 'onboarding',
    name: 'Check-In & Onboard',
    badge: 'Check-In 🏨',
    subtitle: 'Verify Airbnb, MMT & Agoda stays, invite co-guests',
    href: '/onboarding',
    icon: ShieldCheck,
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgGlow: 'bg-emerald-500/10',
    isActive: (path) => path.startsWith('/onboarding'),
  },
];

export default function AppSwitcher({ user }: { user?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || '';

  // Identify current active app
  const currentApp = apps.find(app => app.isActive(pathname)) || (
    pathname === '/' ? apps[0] : null
  );

  return (
    <div className="relative">
      {/* App Switcher Button in Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open App Switcher"
        className={`flex items-center justify-center transition-all duration-300 border active:scale-95 cursor-pointer touch-manipulation relative ${
          isOpen
            ? 'bg-accent-gold text-black border-accent-gold font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]'
            : 'bg-white/[0.04] hover:bg-white/[0.08] text-white border-white/10 hover:border-white/20'
        } w-9 h-9 sm:w-auto sm:px-3.5 sm:py-1.5 sm:gap-2 rounded-full`}
      >
        <LayoutGrid className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-zinc-200" />
        <span className="text-xs font-mono font-semibold tracking-wider hidden sm:inline">
          {currentApp ? currentApp.name : 'Ecosystem'}
        </span>
        {currentApp && (
          <span className="sm:hidden absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-gold shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
        )}
      </button>

      {/* Glassmorphic App Switcher Overlay / Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md"
            />

            {/* Modal Drawer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-16 right-3 sm:right-6 md:right-8 z-[75] w-[calc(100vw-1.5rem)] max-w-sm sm:max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent-gold/15 border border-accent-gold/30 flex items-center justify-center text-accent-gold">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-serif tracking-wide">
                      Nothingness Ecosystem
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      1-Tap Switch between Sanctuary Pillars
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 4 Core Apps Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                {apps.map((app) => {
                  const Icon = app.icon;
                  const isCurrent = app.isActive(pathname);

                  return (
                    <Link
                      key={app.id}
                      href={app.href}
                      onClick={() => setIsOpen(false)}
                      className={`group relative p-3 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 cursor-pointer ${
                        isCurrent
                          ? `${app.borderColor} ${app.bgGlow} shadow-lg ring-1 ring-white/10`
                          : 'border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCurrent 
                          ? `${app.borderColor} ${app.bgGlow} ${app.accentColor}`
                          : 'border-zinc-800 bg-black/60 text-zinc-400 group-hover:text-white'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-xs font-bold tracking-wide ${isCurrent ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                            {app.name}
                          </span>
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isCurrent
                              ? `${app.borderColor} ${app.accentColor} ${app.bgGlow}`
                              : 'border-zinc-800 text-zinc-500 bg-black/40'
                          }`}>
                            {isCurrent ? '● Active' : app.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate leading-snug">
                          {app.subtitle}
                        </p>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        isCurrent ? app.accentColor : 'text-zinc-600 group-hover:text-zinc-300'
                      }`} />
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Quick Utilities */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-3">
                  <Link
                    href="/onboarding"
                    onClick={() => setIsOpen(false)}
                    className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-accent-gold" />
                    <span>Check-In</span>
                  </Link>

                  <Link
                    href="/accessibility"
                    onClick={() => setIsOpen(false)}
                    className="hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Headphones className="w-3.5 h-3.5 text-accent-gold" />
                    <span>Concierge</span>
                  </Link>
                </div>

                {user ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="hover:text-white flex items-center gap-1.5 text-emerald-400 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Active Member</span>
                  </Link>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setIsOpen(false)}
                    className="hover:text-white text-amber-400 font-bold transition-colors"
                  >
                    <span>Member Sign In →</span>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
