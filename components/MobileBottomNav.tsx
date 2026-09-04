'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Building2, 
  Flame, 
  UserCheck, 
  Compass, 
  PlusCircle, 
  Ticket, 
  Headphones, 
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

interface NavItem {
  name: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isSpecialAction?: boolean;
  isActive: (path: string) => boolean;
}

export default function MobileBottomNav() {
  const pathname = usePathname() || '';

  // Hide on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {
      // Fail silently if vibration is not supported
    }
  };

  // Determine App Context for purposeful navigation
  const isLifestyleMode = pathname.startsWith('/kinksters');
  const isEventsMode = pathname.startsWith('/sanctuary-pass');
  const isPortalMode = pathname.startsWith('/dashboard') || pathname.startsWith('/verify') || pathname.startsWith('/booking');

  let items: NavItem[] = [];

  if (isLifestyleMode) {
    // Purposeful Lifestyle App Navigation
    items = [
      {
        name: 'Feed',
        href: '/kinksters',
        icon: Flame,
        isActive: (p) => p === '/kinksters',
      },
      {
        name: 'Discover',
        href: '/kinksters/discover',
        icon: Compass,
        isActive: (p) => p.startsWith('/kinksters/discover'),
      },
      {
        name: 'Post',
        isSpecialAction: true,
        onClick: () => {
          triggerHaptic();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('open-create-post'));
          }
        },
        icon: PlusCircle,
        isActive: () => false,
      },
      {
        name: 'Events',
        href: '/kinksters/events',
        icon: Sparkles,
        badge: '✨',
        isActive: (p) => p.startsWith('/kinksters/events'),
      },
      {
        name: 'Portal',
        href: '/dashboard',
        icon: UserCheck,
        isActive: (p) => p.startsWith('/dashboard'),
      },
    ];
  } else if (isEventsMode) {
    // Purposeful Events App Navigation
    items = [
      {
        name: 'Vault',
        href: '/sanctuary-pass',
        icon: Ticket,
        isActive: (p) => p === '/sanctuary-pass',
      },
      {
        name: 'Lifestyle',
        href: '/kinksters',
        icon: Flame,
        badge: '🔥',
        isActive: (p) => p.startsWith('/kinksters'),
      },
      {
        name: 'Spaces',
        href: '/spaces',
        icon: Building2,
        isActive: (p) => p.startsWith('/spaces'),
      },
      {
        name: 'Concierge',
        href: '/accessibility',
        icon: Headphones,
        isActive: (p) => p.startsWith('/accessibility'),
      },
      {
        name: 'Portal',
        href: '/dashboard',
        icon: UserCheck,
        isActive: (p) => p.startsWith('/dashboard'),
      },
    ];
  } else if (isPortalMode) {
    // Purposeful Member Portal Navigation
    items = [
      {
        name: 'Overview',
        href: '/dashboard',
        icon: UserCheck,
        isActive: (p) => p === '/dashboard',
      },
      {
        name: 'Spaces',
        href: '/spaces',
        icon: Building2,
        isActive: (p) => p.startsWith('/spaces'),
      },
      {
        name: 'Events',
        href: '/sanctuary-pass',
        icon: Sparkles,
        badge: '✨',
        isActive: (p) => p.startsWith('/sanctuary-pass'),
      },
      {
        name: 'Lifestyle',
        href: '/kinksters',
        icon: Flame,
        badge: '🔥',
        isActive: (p) => p.startsWith('/kinksters'),
      },
    ];
  } else {
    // General Spaces & Exploration Navigation
    items = [
      {
        name: 'Spaces',
        href: '/spaces',
        icon: Building2,
        isActive: (p) => p === '/' || p.startsWith('/spaces'),
      },
      {
        name: 'Events',
        href: '/sanctuary-pass',
        icon: Sparkles,
        badge: '✨',
        isActive: (p) => p.startsWith('/sanctuary-pass'),
      },
      {
        name: 'Lifestyle',
        href: '/kinksters',
        icon: Flame,
        badge: '🔥',
        isActive: (p) => p.startsWith('/kinksters'),
      },
      {
        name: 'Portal',
        href: '/dashboard',
        icon: UserCheck,
        isActive: (p) => p.startsWith('/dashboard') || p.startsWith('/auth'),
      },
    ];
  }

  return (
    <nav 
      aria-label="Purposeful App Navigation Bar"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-2xl border-t border-white/10 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] px-3 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;

          if (item.isSpecialAction) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className="relative flex flex-col items-center justify-center py-1 px-3 -mt-4 active:scale-90 transition-all duration-200 cursor-pointer touch-manipulation"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.5)] border-2 border-black">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-rose-300 mt-1 tracking-wider">
                  {item.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href || '#'}
              onClick={triggerHaptic}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 touch-manipulation ${
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
