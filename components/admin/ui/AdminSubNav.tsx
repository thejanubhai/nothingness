'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { findHubForPathname } from '@/lib/admin-nav';

export default function AdminSubNav() {
  const pathname = usePathname();
  const currentHub = findHubForPathname(pathname);

  // If no hub, or hub only has 1 sub-item (e.g. Dashboard), do not render
  if (!currentHub || currentHub.subItems.length <= 1) {
    return null;
  }

  // Find most specific active sub-item (longest matching href)
  const activeSubItem = currentHub.subItems
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find((sub) => {
      if (sub.exact) return pathname === sub.href;
      return pathname === sub.href || pathname.startsWith(`${sub.href}/`);
    });

  const HubIcon = currentHub.icon;

  return (
    <div className="sticky top-14 z-15 bg-zinc-950/90 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-6 md:px-8 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Parent Hub Title Indicator */}
        <div className="hidden lg:flex items-center gap-2 pr-3 border-r border-white/10 shrink-0 select-none">
          <HubIcon className="w-3.5 h-3.5 text-accent-gold" />
          <span className="text-[10px] uppercase font-mono tracking-widest text-white/50 font-bold">
            {currentHub.shortName || currentHub.name}
          </span>
        </div>

        {/* Horizontal Sub-tabs */}
        <nav 
          aria-label={`${currentHub.name} Sub-navigation`}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5"
        >
          {currentHub.subItems.map((sub) => {
            const active = activeSubItem?.href === sub.href;
            const Icon = sub.icon;

            return (
              <Link
                key={sub.href}
                href={sub.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all font-mono shrink-0 ${
                  active
                    ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30 font-bold shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    active ? 'text-accent-gold' : 'text-white/40'
                  }`}
                />
                <span>{sub.name}</span>
                {sub.badge && (
                  <span
                    className={`text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded font-bold ${
                      active
                        ? 'bg-accent-gold/25 text-accent-gold border border-accent-gold/40'
                        : 'bg-white/5 border border-white/10 text-white/50'
                    }`}
                  >
                    {sub.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
