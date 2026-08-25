'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Building2, Flame, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isActive: (path: string) => boolean;
}

const navItems: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Sparkles,
    isActive: (path) => path === '/',
  },
  {
    name: 'Sanctuaries',
    href: '/spaces',
    icon: Building2,
    isActive: (path) => path.startsWith('/spaces'),
  },
  {
    name: 'Lifestyle',
    href: '/kinksters',
    icon: Flame,
    badge: '🔥',
    isActive: (path) => path.startsWith('/kinksters'),
  },
  {
    name: 'Portal',
    href: '/dashboard',
    icon: UserCheck,
    isActive: (path) => path.startsWith('/dashboard') || path.startsWith('/auth'),
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {
      // Haptics not supported or permitted, fail silently
    }
  };

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/85 backdrop-blur-2xl border-t border-white/10 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] px-3 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const active = item.isActive(pathname || '');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={triggerHaptic}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                active ? 'text-accent-gold' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {/* Active Indicator Glow Background */}
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-white/[0.06] border border-white/10 rounded-2xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex items-center justify-center">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110 text-accent-gold' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-3 text-[10px] leading-none">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`relative z-10 text-[10px] font-medium tracking-wider mt-1 transition-colors ${
                active ? 'text-accent-gold font-bold' : 'text-white/50'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
