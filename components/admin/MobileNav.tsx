'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, LayoutDashboard, Building2, CalendarDays, 
  Users, CreditCard, Sparkles, Settings, LogOut, ChevronRight,
  BookOpen, Clock, ShieldCheck, MessageSquare, Bell, FileText,
  Ticket, ScrollText, PenTool
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';

type NavItem = {
  name: string;
  href: string;
  icon: any;
  badge?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: 'Core Operations',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Calendar & Bookings', href: '/admin/calendar', icon: CalendarDays },
    ],
  },
  {
    title: 'Lifestyle & Gatherings',
    items: [
      { name: 'Gatherings & Munches', href: '/admin/events', icon: Sparkles, badge: 'Gatekeeper' },
      { name: 'Sanctuary Pass', href: '/admin/sanctuary-pass', icon: Ticket },
      { name: 'Guest CRM & Police', href: '/admin/guests', icon: Users, badge: 'ID Vetting' },
    ],
  },
  {
    title: 'Sanctuaries & Ops',
    items: [
      { name: 'Suites & Spaces', href: '/admin/spaces', icon: Building2 },
      { name: 'Housekeeping Turnovers', href: '/admin/housekeeping', icon: ShieldCheck },
      { name: 'Franchise & Partners', href: '/admin/partners', icon: Building2 },
    ],
  },
  {
    title: 'Communications',
    items: [
      { name: 'Inbox & Flows', href: '/admin/inbox', icon: MessageSquare, badge: 'Omnichannel' },
      { name: 'Contact Inquiries', href: '/admin/messages', icon: FileText },
      { name: 'Push Broadcasts', href: '/admin/notifications', icon: Bell },
    ],
  },
  {
    title: 'Content & Brand',
    items: [
      { name: 'Homepage CMS', href: '/admin/cms', icon: PenTool },
      { name: 'Editorial Journal', href: '/admin/journal', icon: BookOpen },
    ],
  },
  {
    title: 'Finance & System',
    items: [
      { name: 'Financials & Ledger', href: '/admin/financials', icon: CreditCard },
      { name: 'Audit Log', href: '/admin/audit', icon: ScrollText },
      { name: 'Settings & Fees', href: '/admin/settings', icon: Settings },
    ],
  },
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
            <nav className="space-y-4">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1.5">
                  <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold px-2">
                    {section.title}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs transition-all active:scale-[0.98] ${
                              isActive 
                                ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30 font-bold' 
                                : 'text-white/70 hover:text-white bg-white/[0.02] border border-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className={`w-4 h-4 ${isActive ? 'text-accent-gold' : 'text-white/40'}`} />
                              <span>{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.badge && (
                                <span className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
                                  {item.badge}
                                </span>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 text-white/20" />
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
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
