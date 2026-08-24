import { redirect } from "next/navigation";
import MobileNav from "@/components/admin/MobileNav";
import { createClient } from "@/lib/supabase/server";
import { normalizeIdentifier } from "@/lib/auth-utils";
import { env } from "@/lib/env";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Building2, 
  CalendarDays, 
  Users, 
  CreditCard, 
  Sparkles, 
  Settings,
  LogOut
} from "lucide-react";
import { signOut } from "@/app/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminIdentifier = normalizeIdentifier(env.ADMIN || '');
  const userPhone = user?.phone ? normalizeIdentifier(user.phone) : null;

  if (!user || (userPhone !== adminIdentifier && !user.email?.includes('admin') && !user.email?.includes('hudav'))) {
    redirect('/auth');
  }

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

  return (
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] max-h-[100dvh] bg-background overflow-hidden selection:bg-accent-gold/30 w-full">
      <MobileNav />
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-white/[0.02] border-r border-white/5 flex-col shrink-0 h-full">
        <div className="p-6 border-b border-white/5">
          <Link href="/admin" className="font-serif text-2xl text-accent-gold tracking-wide">
            Nothingness
          </Link>
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mt-1">Command Center</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4" data-lenis-prevent>
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors group"
                >
                  <item.icon className="w-4 h-4 text-white/40 group-hover:text-accent-gold transition-colors" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="px-3 py-3 rounded-lg bg-white/[0.02] border border-white/5 mb-3">
            <p className="text-xs text-white truncate">{user.email}</p>
            <p className="text-[10px] text-accent-gold uppercase tracking-widest mt-1">Admin</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden bg-black relative w-full overscroll-contain"
        data-lenis-prevent
      >
        <div className="fixed inset-0 bg-grain opacity-[0.02] pointer-events-none z-0" />
        <div className="min-h-full p-4 sm:p-8 md:p-12 max-w-7xl mx-auto relative z-10 pb-20 md:pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
