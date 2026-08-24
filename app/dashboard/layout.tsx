'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Settings, LogOut, Building2, Flame, ShieldCheck } from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import { motion } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Profile & Level 1', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Bookings', href: '/dashboard/bookings', icon: CalendarDays },
    { name: 'Passkeys & Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen pt-28 sm:pt-32 pb-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10">
      
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="sticky top-28 sm:top-32 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
              <ShieldCheck className="w-5 h-5 text-accent-gold" />
              <h2 className="font-serif text-lg text-white font-bold">User Portal</h2>
            </div>

            <nav className="space-y-1.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 relative ${
                      isActive 
                        ? 'bg-zinc-900 text-white font-medium border border-zinc-700' 
                        : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-accent-gold' : 'text-zinc-500'}`} />
                    <span className="text-xs tracking-wide">{item.name}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeUserTab" 
                        className="absolute left-0 w-1 h-6 bg-accent-gold rounded-r-full" 
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Access to Level 2 Services */}
            <div className="pt-4 mt-4 border-t border-zinc-800 space-y-1.5">
              <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 px-3 block">Level 2 Ecosystem</span>
              <Link
                href="/franchise"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-colors text-xs font-medium"
              >
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Partner Host</span>
              </Link>
              <Link
                href="/kinksters"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-medium"
              >
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Lifestyle Circle</span>
              </Link>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-800">
              <form action={signOut}>
                <button type="submit" className="flex items-center gap-3 px-3.5 py-2.5 w-full text-left text-xs font-medium tracking-wide text-red-400/80 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
