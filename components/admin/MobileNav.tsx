'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, LayoutDashboard, Building2, CalendarDays, 
  Users, CreditCard, Sparkles, Settings, LogOut, ChevronRight
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Sanctuary Gatherings', href: '/admin/events', icon: Sparkles },
  { name: 'Sanctuaries', href: '/admin/spaces', icon: Building2 },
  { name: 'Franchise & Partners', href: '/admin/partners', icon: Sparkles },
  { name: 'Editorial Journal', href: '/admin/journal', icon: Sparkles },
  { name: 'Calendar & OTA', href: '/admin/calendar', icon: CalendarDays },
  { name: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Guest CRM & Police', href: '/admin/guests', icon: Users },
  { name: 'Housekeeping', href: '/admin/housekeeping', icon: Sparkles },
  { name: 'Financials', href: '/admin/financials', icon: CreditCard },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 inset-x-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-white/10 px-5 py-3.5 pt-[calc(0.875rem+env(safe-area-inset-top))] flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="font-serif text-xl font-bold tracking-wide text-accent-gold">Nothingness</span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full">
            Admin
          </span>
        </Link>

        <button 
          onClick={() => setIsOpen(!isOpen)} 
          aria-label="Toggle Navigation"
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white transition-colors active:scale-95"
        >
          {isOpen ? <X className="w-5 h-5 text-accent-gold" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Fullscreen Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 top-[57px] z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-6 overflow-y-auto pb-[calc(3rem+env(safe-area-inset-bottom))]">
          <div className="space-y-6">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">Navigation Menu</p>
            <nav>
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm transition-all active:scale-[0.98] ${
                          isActive 
                            ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30 font-bold' 
                            : 'text-white/70 hover:text-white bg-white/[0.02] border border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <item.icon className={`w-5 h-5 ${isActive ? 'text-accent-gold' : 'text-white/40'}`} />
                          <span>{item.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-3">
            <form action={signOut}>
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider transition-colors active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                Sign Out of Admin
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
