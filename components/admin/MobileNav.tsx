'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Building2, CalendarDays, Users, MessageSquare, CreditCard, Sparkles, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Sanctuaries', href: '/admin/spaces', icon: Building2 },
  { name: 'Calendar & Channels', href: '/admin/calendar', icon: CalendarDays },
  { name: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Guest CRM & Police', href: '/admin/guests', icon: Users },
  { name: 'Housekeeping', href: '/admin/housekeeping', icon: Sparkles },
  { name: 'Financials', href: '/admin/financials', icon: CreditCard },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between p-4 bg-white/[0.02] border-b border-white/5">
        <Link href="/admin" className="font-serif text-xl text-accent-gold tracking-wide">
          Nothingness
        </Link>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-white/70 hover:text-white">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-[65px] left-0 right-0 bottom-0 bg-black z-50 overflow-y-auto">
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                        isActive 
                          ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-accent-gold' : 'text-white/40'}`} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
