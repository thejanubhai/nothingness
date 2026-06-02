'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Settings, LogOut } from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import { motion } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Bookings', href: '/dashboard/bookings', icon: CalendarDays },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen pt-32 pb-24 px-5 md:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
      
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="sticky top-32 space-y-8">
          <div>
            <h2 className="font-serif text-2xl text-white mb-6">Guest Portal</h2>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/10 text-white font-medium' 
                        : 'text-white/50 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-accent-gold' : ''}`} />
                    <span className="text-sm tracking-wide">{item.name}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab" 
                        className="absolute left-0 w-1 h-8 bg-accent-gold rounded-r-full" 
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-white/10">
            <form action={signOut}>
              <button type="submit" className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm tracking-wide text-red-400/70 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-300">
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
