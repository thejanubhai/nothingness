'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, ChevronRight, LogOut 
} from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import { ADMIN_HUBS, type AdminHub } from '@/lib/admin-nav';

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

  const isHubActive = (hub: AdminHub) => {
    if (hub.id === 'dashboard') {
      return pathname === '/admin';
    }
    if (pathname === hub.href || pathname.startsWith(`${hub.href}/`)) {
      return true;
    }
    return hub.subItems.some((sub) => {
      if (sub.exact) return pathname === sub.href;
      return pathname === sub.href || pathname.startsWith(`${sub.href}/`);
    });
  };

  const isSubActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

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
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white transition-colors active:scale-95 cursor-pointer"
        >
          {isOpen ? <X className="w-5 h-5 text-accent-gold" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Fullscreen Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 top-[57px] z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-6 overflow-y-auto pb-[calc(3rem+env(safe-area-inset-bottom))]">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
                8 Parent Domains
              </p>
              <span className="text-[9px] font-mono text-accent-gold/80">Command OS</span>
            </div>

            <nav className="space-y-2">
              {ADMIN_HUBS.map((hub) => {
                const active = isHubActive(hub);
                const HubIcon = hub.icon;
                const hasMultipleSubItems = hub.subItems.length > 1;

                return (
                  <div key={hub.id} className="space-y-1">
                    <Link
                      href={hub.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs transition-all active:scale-[0.98] ${
                        active 
                          ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30 font-bold shadow-[0_0_12px_rgba(212,175,55,0.15)]' 
                          : 'text-white/70 hover:text-white bg-white/[0.02] border border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <HubIcon className={`w-4 h-4 ${active ? 'text-accent-gold' : 'text-white/40'}`} />
                        <span>{hub.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hub.badge && (
                          <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${
                            active
                              ? 'bg-accent-gold/25 text-accent-gold border border-accent-gold/40'
                              : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                          }`}>
                            {hub.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 ${active ? 'text-accent-gold' : 'text-white/20'}`} />
                      </div>
                    </Link>

                    {/* Expandable sub-items on active hub */}
                    {active && hasMultipleSubItems && (
                      <div className="pl-4 pr-1 py-1 space-y-1 border-l border-accent-gold/25 ml-4">
                        {hub.subItems.map((sub) => {
                          const subActive = isSubActive(sub.href, sub.exact);
                          const SubIcon = sub.icon;

                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-mono transition-all ${
                                subActive
                                  ? 'bg-accent-gold/20 text-accent-gold font-bold border border-accent-gold/30'
                                  : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <SubIcon className={`w-3.5 h-3.5 ${subActive ? 'text-accent-gold' : 'text-white/30'}`} />
                                <span>{sub.name}</span>
                              </div>
                              {sub.badge && (
                                <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/5 text-white/40 font-bold">
                                  {sub.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-3">
            <form action={signOut}>
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider transition-colors active:scale-95 cursor-pointer font-mono"
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
