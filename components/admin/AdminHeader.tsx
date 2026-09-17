'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { findHubForPathname } from '@/lib/admin-nav';
import { 
  Search, 
  ChevronRight, 
  Plus, 
  Scan,
} from 'lucide-react';

interface AdminHeaderProps {
  onOpenCommandPalette: () => void;
}

export default function AdminHeader({ onOpenCommandPalette }: AdminHeaderProps) {
  const pathname = usePathname();

  // Find matching parent hub
  const currentHub = findHubForPathname(pathname);

  // Find most specific active sub-item
  const activeSubItem = currentHub?.subItems
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find((sub) => {
      if (sub.exact) return pathname === sub.href;
      return pathname === sub.href || pathname.startsWith(`${sub.href}/`);
    });

  const showSubItemBreadcrumb = activeSubItem && activeSubItem.href !== currentHub?.href;

  return (
    <header className="hidden md:flex h-14 bg-black/70 backdrop-blur-xl border-b border-white/5 items-center justify-between px-8 sticky top-0 z-20">
      {/* Dynamic Hierarchical Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <Link 
          href="/admin" 
          className="text-white/40 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span className="text-accent-gold font-bold">Admin</span>
        </Link>

        {currentHub && currentHub.id !== 'dashboard' && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-white/20" />
            <Link
              href={currentHub.href}
              className={`hover:text-accent-gold transition-colors ${
                showSubItemBreadcrumb ? 'text-white/50' : 'text-white/90 font-semibold'
              }`}
            >
              {currentHub.name}
            </Link>
          </>
        )}

        {showSubItemBreadcrumb && activeSubItem && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-white/20" />
            <span className="text-accent-gold font-medium">
              {activeSubItem.name}
            </span>
          </>
        )}
      </div>

      {/* Center Search Spotlight Trigger */}
      <div className="flex-1 max-w-md mx-6">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-accent-gold/30 text-white/40 hover:text-white transition-all text-xs group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-accent-gold/60 group-hover:text-accent-gold transition-colors" />
            <span className="text-white/50 group-hover:text-white/80 transition-colors">
              Spotlight Search... (guests, spaces, bookings)
            </span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 group-hover:text-accent-gold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Quick Actions & System Pulse */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/5 text-[10px] font-mono text-white/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>PostgreSQL + Edge 2026</span>
        </div>

        <Link
          href="/admin/marshall-scanner"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-mono font-medium transition-all"
          title="Gatekeeper Pass Scanner"
        >
          <Scan className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden xl:inline">Scanner</span>
        </Link>

        <Link
          href="/admin/bookings/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-gold hover:bg-white text-black text-xs font-mono font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Booking</span>
        </Link>
      </div>
    </header>
  );
}
