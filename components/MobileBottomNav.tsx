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
  ShieldCheck,
  MessageSquare,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

interface NavItem {
  name: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  hasLivePulse?: boolean;
  isSpecialAction?: boolean;
  isActive: (path: string) => boolean;
}

export default function MobileBottomNav() {
  const pathname = usePathname() || '';
  const [activeContext, setActiveContext] = React.useState<any>(null);

  // Sync active context from Header event or fetch directly
  React.useEffect(() => {
    let isMounted = true;

    const handleContextUpdate = (e: any) => {
      if (e.detail && isMounted) {
        setActiveContext(e.detail);
      }
    };

    const fetchContext = async () => {
      try {
        const res = await fetch('/api/user/active-context');
        if (res.ok && isMounted) {
          const data = await res.json();
          setActiveContext(data);
        }
      } catch (_) {}
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('active-context-updated', handleContextUpdate);
      window.addEventListener('refresh-active-context', fetchContext);
    }

    fetchContext();

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('active-context-updated', handleContextUpdate);
        window.removeEventListener('refresh-active-context', fetchContext);
      }
    };
  }, []);

  // Hide on admin routes and single space checkout views where the dedicated reservation drawer floats
  if (pathname.startsWith('/admin') || (pathname.startsWith('/spaces/') && pathname !== '/spaces')) {
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
  const isUnifiedLifestyleOrEvents = pathname.startsWith('/kinksters') || pathname.startsWith('/sanctuary-pass');
  const isLoggedIn = Boolean(activeContext?.isLoggedIn);

  let items: NavItem[] = [];

  if (isUnifiedLifestyleOrEvents) {
    // Purposeful Unified Kinkster & Events Navigation: [Feed] [Events] [Post] [Groups] [Explore]
    items = [
      {
        name: 'Feed',
        href: '/kinksters',
        icon: Flame,
        isActive: (p) => p === '/kinksters',
      },
      {
        name: 'Events',
        href: '/kinksters/events',
        icon: Sparkles,
        badge: '✨',
        isActive: (p) => p.startsWith('/kinksters/events') || p.startsWith('/sanctuary-pass'),
      },
      {
        name: 'Post',
        isSpecialAction: true,
        onClick: () => {
          triggerHaptic();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('open-creation-sheet'));
          }
        },
        icon: PlusCircle,
        isActive: () => false,
      },
      {
        name: 'Groups',
        href: '/kinksters/groups',
        icon: Users,
        isActive: (p) => p.startsWith('/kinksters/groups'),
      },
      {
        name: 'Explore',
        href: '/kinksters/explore',
        icon: Compass,
        isActive: (p) => p.startsWith('/kinksters/explore') || p.startsWith('/kinksters/discover'),
      },
    ];
  } else if (isLoggedIn) {
    // State B: Purposeful Logged-In Navigation: [Suites] [My Stays] [Gatherings] [The Circle] [Vault]
    const hasActiveStay = Boolean(activeContext?.activeStay?.isTodayOrActive);
    items = [
      {
        name: 'Suites',
        href: '/spaces',
        icon: Building2,
        isActive: (p) => p === '/spaces' || (p.startsWith('/spaces') && !p.startsWith('/spaces/')),
      },
      {
        name: 'My Stays',
        href: '/dashboard/bookings',
        icon: KeyRound,
        badge: hasActiveStay ? (activeContext?.activeStay?.doorPin ? 'PIN' : 'LIVE') : undefined,
        hasLivePulse: hasActiveStay,
        isActive: (p) => p.startsWith('/dashboard/bookings'),
      },
      {
        name: 'Gatherings',
        href: '/sanctuary-pass',
        icon: Sparkles,
        badge: '✨',
        isActive: (p) => p.startsWith('/sanctuary-pass'),
      },
      {
        name: 'The Circle',
        href: '/kinksters',
        icon: Flame,
        badge: '✦',
        isActive: (p) => p.startsWith('/kinksters'),
      },
      {
        name: 'Vault',
        href: '/dashboard',
        icon: UserCheck,
        isActive: (p) => p === '/dashboard' || p.startsWith('/dashboard/profile') || p.startsWith('/dashboard/settings'),
      },
    ];
  } else {
    // State A: Clear 4-Tab Public Exploration for Guests: [Suites] [Gatherings] [The Circle] [Sign In]
    items = [
      {
        name: 'Suites',
        href: '/spaces',
        icon: Building2,
        isActive: (p) => p === '/' || p.startsWith('/spaces'),
      },
      {
        name: 'Gatherings',
        href: '/sanctuary-pass',
        icon: Sparkles,
        badge: '✨',
        isActive: (p) => p.startsWith('/sanctuary-pass'),
      },
      {
        name: 'The Circle',
        href: '/kinksters',
        icon: Flame,
        badge: '✦',
        isActive: (p) => p.startsWith('/kinksters'),
      },
      {
        name: 'Sign In',
        href: '/auth',
        icon: ShieldCheck,
        isActive: (p) => p.startsWith('/auth') || p.startsWith('/onboarding'),
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
                type="button"
                onClick={() => {
                  triggerHaptic();
                  if (item.onClick) {
                    item.onClick();
                  } else if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-creation-sheet'));
                  }
                }}
                className="relative flex flex-col items-center justify-center py-1 px-3 -mt-4 active:scale-90 transition-all duration-200 cursor-pointer touch-manipulation focus:outline-none"
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
                {item.hasLivePulse && (
                  <span className="absolute -top-1 -left-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
                {item.badge && (
                  <span className={`absolute -top-1.5 -right-3 text-[10px] leading-none ${
                    item.badge === 'PIN' || item.badge === 'LIVE' 
                      ? 'text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : ''
                  }`}>
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
