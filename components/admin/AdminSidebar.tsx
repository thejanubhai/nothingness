'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_HUBS, type AdminHub } from '@/lib/admin-nav';
import { LogOut, Search, ChevronRight } from 'lucide-react';
import { signOut } from '@/app/actions/auth';

interface AdminSidebarProps {
  userEmail?: string;
  onOpenCommandPalette?: () => void;
}

export default function AdminSidebar({ userEmail, onOpenCommandPalette }: AdminSidebarProps) {
  const pathname = usePathname();

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
    <aside className="hidden md:flex w-64 bg-zinc-950/90 backdrop-blur-2xl border-r border-white/5 flex-col fixed inset-y-0 left-0 z-30 h-screen select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <Link href="/admin" className="group flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="font-serif font-bold text-accent-gold text-base">N</span>
          </div>
          <div>
            <span className="font-serif text-lg text-white font-bold tracking-wide group-hover:text-accent-gold transition-colors">
              Nothingness
            </span>
            <p className="text-[9px] uppercase tracking-[0.22em] text-accent-gold/70 font-mono font-medium">
              Command OS
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
            Live
          </span>
        </div>
      </div>

      {/* Quick Search Spotlight Button */}
      <div className="px-3 pt-3 pb-1">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-white/50 hover:text-white text-xs transition-all group cursor-pointer shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-accent-gold/70 group-hover:text-accent-gold transition-colors" />
            <span className="font-sans text-xs">Spotlight Search...</span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 group-hover:text-accent-gold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* 8 Parent Hubs Navigation Stream */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
        <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold px-3 py-1">
          Parent Domains ({ADMIN_HUBS.length})
        </p>

        {ADMIN_HUBS.map((hub) => {
          const active = isHubActive(hub);
          const HubIcon = hub.icon;
          const hasMultipleSubItems = hub.subItems.length > 1;

          return (
            <div key={hub.id} className="space-y-1">
              {/* Parent Hub Item */}
              <Link
                href={hub.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-all group font-sans ${
                  active
                    ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30 font-bold shadow-[0_0_15px_rgba(212,175,55,0.12)]'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <HubIcon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active
                        ? 'text-accent-gold'
                        : 'text-white/40 group-hover:text-accent-gold'
                    }`}
                  />
                  <span className="truncate">{hub.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {hub.badge && (
                    <span
                      className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${
                        active
                          ? 'bg-accent-gold/25 text-accent-gold border border-accent-gold/40'
                          : 'bg-white/5 border border-white/10 text-white/50'
                      }`}
                    >
                      {hub.badge}
                    </span>
                  )}
                  {hasMultipleSubItems && (
                    <ChevronRight
                      className={`w-3 h-3 transition-transform ${
                        active ? 'rotate-90 text-accent-gold' : 'text-white/20'
                      }`}
                    />
                  )}
                </div>
              </Link>

              {/* Nested Sub-items (when parent is active and has multiple sub-items) */}
              {active && hasMultipleSubItems && (
                <div className="border-l border-accent-gold/20 pl-3 ml-4 space-y-1 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {hub.subItems.map((sub) => {
                    const subActive = isSubActive(sub.href, sub.exact);
                    const SubIcon = sub.icon;

                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-mono transition-all ${
                          subActive
                            ? 'bg-accent-gold/20 text-accent-gold font-bold border border-accent-gold/30'
                            : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <SubIcon
                            className={`w-3 h-3 shrink-0 ${
                              subActive ? 'text-accent-gold' : 'text-white/30'
                            }`}
                          />
                          <span className="truncate">{sub.name}</span>
                        </div>
                        {sub.badge && (
                          <span className="text-[7px] uppercase tracking-wider px-1 py-0.2 rounded bg-white/5 text-white/40 font-bold">
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

      {/* User Footer Profile & Sign Out */}
      <div className="p-3 border-t border-white/5 bg-black/40 backdrop-blur-md">
        <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 mb-2">
          <p className="text-xs text-white truncate font-medium">
            {userEmail || 'admin@nothingness.asia'}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-accent-gold font-mono uppercase tracking-widest font-bold">
              Root Authority
            </span>
            <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              2FA Active
            </span>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all font-mono cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
