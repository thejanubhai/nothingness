'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Building2, 
  UserCheck, 
  KeyRound,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  hasLivePulse?: boolean;
  isActive: (path: string) => boolean;
}

export default function MobileBottomNav() {
  const pathname = usePathname() || '';
  const [activeContext, setActiveContext] = React.useState<any>(null);

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

  if (pathname.startsWith('/admin') || (pathname.startsWith('/spaces/') && pathname !== '/spaces')) {
    return null;
  }

  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {}
  };

  const isLoggedIn = Boolean(activeContext?.isLoggedIn);
  let items: NavItem[] = [];

  if (isLoggedIn) {
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
        name: 'Journal',
        href: '/journal',
        icon: BookOpen,
        isActive: (p) => p.startsWith('/journal'),
      },
      {
        name: 'Vault',
        href: '/dashboard',
        icon: UserCheck,
        isActive: (p) => p === '/dashboard' || p.startsWith('/dashboard/profile') || p.startsWith('/dashboard/settings'),
      },
    ];
  } else {
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
        name: 'Check-In',
        href: '/onboarding',
        icon: ShieldCheck,
        isActive: (p) => p.startsWith('/onboarding'),
      },
      {
        name: 'Journal',
        href: '/journal',
        icon: BookOpen,
        isActive: (p) => p.startsWith('/journal'),
      },
      {
        name: 'Sign In',
        href: '/auth',
        icon: UserCheck,
        isActive: (p) => p.startsWith('/auth'),
      },
    ];
  }

  return (
    <nav 
      aria-label="App Navigation Bar"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-2xl border-t border-white/10 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] px-3 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href || '#'}
              onClick={triggerHaptic}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 touch-manipulation ${
                active ? 'text-accent-gold' : 'text-white/50 hover:text-white/80'
              }`}
            >
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
