import { redirect } from "next/navigation";
import MobileNav from "@/components/admin/MobileNav";
import { createClient } from "@/lib/supabase/server";
import { isUserAdminAsync } from "@/lib/auth-utils";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Building2, 
  CalendarDays, 
  Users, 
  CreditCard, 
  Sparkles, 
  Settings,
  LogOut,
  BookOpen,
  Clock,
  ShieldCheck,
  MessageSquare,
  Bell,
  FileText,
  Ticket,
  ScrollText,
  PenTool,
  Flag
} from "lucide-react";
import { signOut } from "@/app/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?redirect=/admin');
  }

  const isAdmin = await isUserAdminAsync(user);
  if (!isAdmin) {
    redirect('/dashboard');
  }

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
        { name: 'Safety & Moderation', href: '/admin/moderation', icon: Flag, badge: 'Reports' },
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

  return (
    <div className="min-h-screen bg-black text-foreground selection:bg-accent-gold/30 w-full relative flex flex-col">
      <MobileNav />
      {/* Sidebar - Fixed on desktop */}
      <aside className="hidden md:flex w-64 bg-white/[0.02] border-r border-white/5 flex-col fixed inset-y-0 left-0 z-30 h-screen">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <Link href="/admin" className="font-serif text-2xl text-accent-gold tracking-wide">
              Nothingness
            </Link>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 mt-0.5">Admin Command</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Live" />
        </div>

        <nav className="flex-1 overflow-y-auto py-3 space-y-4">
          {navSections.map((section) => (
            <div key={section.title} className="px-3">
              <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold px-3 mb-1">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-white/65 hover:text-white hover:bg-white/5 transition-all group font-sans"
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-3.5 h-3.5 text-white/40 group-hover:text-accent-gold transition-colors shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 mb-2.5">
            <p className="text-xs text-white truncate font-medium">{user.email}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-accent-gold font-mono uppercase tracking-widest font-bold">Administrator</span>
              <span className="text-[9px] text-emerald-400 font-mono">2FA Active</span>
            </div>
          </div>
          <form action={signOut}>
            <button type="submit" className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400/80 hover:text-red-400 hover:bg-red-400/10 transition-colors font-mono cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area - Naturally scrolls on desktop & mobile */}
      <main className="md:pl-64 min-h-screen bg-black relative w-full flex-1">
        <div className="fixed inset-0 bg-grain opacity-[0.02] pointer-events-none z-0" />
        <div className="min-h-full p-4 sm:p-8 md:p-12 max-w-7xl mx-auto relative z-10 pb-16 md:pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
