'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  ArrowRight, 
  Plus, 
  Scan, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Smartphone,
  Settings,
  Users,
  MessageSquare
} from 'lucide-react';
import { ALL_ADMIN_PALETTE_ITEMS, type AdminPaletteItem } from '@/lib/admin-nav';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAction {
  id: string;
  name: string;
  desc: string;
  icon: any;
  href?: string;
  badge?: string;
  action?: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'new-booking',
      name: 'Create Direct Reservation',
      desc: 'Reserve a suite directly with custom dates & guest details',
      icon: Plus,
      href: '/admin/bookings/new',
      badge: 'Reservations',
    },
    {
      id: 'gatekeeper-scanner',
      name: 'Launch Entry Scanner',
      desc: 'Scan QR entry pass for events and sanctuary access',
      icon: Scan,
      href: '/admin/marshall-scanner',
      badge: 'Gatherings',
    },
    {
      id: 'cleaner-dispatch',
      name: 'Housekeeping Turnovers',
      desc: 'Check turnover schedule and dispatch caretaker notifications',
      icon: ShieldCheck,
      href: '/admin/housekeeping',
      badge: 'Sanctuaries',
    },
    {
      id: 'guest-vetting',
      name: 'Review Pending Guest IDs',
      desc: 'Approve or reject guest Aadhaar / Passport submissions',
      icon: Users,
      href: '/admin/guests',
      badge: 'Guest CRM',
    },
    {
      id: 'police-register',
      name: 'Statutory Police Form C Register',
      desc: 'Inspect or export police guest register for law enforcement',
      icon: ShieldCheck,
      href: '/admin/guests/police-register',
      badge: 'Compliance',
    },
    {
      id: 'whatsapp-test',
      name: 'WhatsApp Cloud API Diagnostics',
      desc: 'Send a diagnostic message & verify Meta webhook status',
      icon: Smartphone,
      href: '/admin/whatsapp-connect',
      badge: 'Communications',
    },
    {
      id: 'system-settings',
      name: 'Platform Fees & Policies',
      desc: 'Adjust base GST rate, deposit amounts and AI system prompts',
      icon: Settings,
      href: '/admin/settings',
      badge: 'System',
    },
  ], []);

  // Filter navigation items
  const filteredNavItems = useMemo(() => {
    if (!query.trim()) return ALL_ADMIN_PALETTE_ITEMS.slice(0, 10);
    const q = query.toLowerCase().trim();
    return ALL_ADMIN_PALETTE_ITEMS.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.desc?.toLowerCase().includes(q);
      const matchParent = item.parentHubName.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchName || matchDesc || matchParent || matchKeywords;
    });
  }, [query]);

  // Filter quick actions
  const filteredActions = useMemo(() => {
    if (!query.trim()) return quickActions.slice(0, 4);
    const q = query.toLowerCase().trim();
    return quickActions.filter(
      (a) => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q) || a.badge?.toLowerCase().includes(q)
    );
  }, [query, quickActions]);

  // Combined flat list for keyboard arrow navigation
  const combinedItems = useMemo(() => {
    const items: Array<{ type: 'action' | 'nav'; data: any }> = [];
    filteredActions.forEach((a) => items.push({ type: 'action', data: a }));
    filteredNavItems.forEach((n) => items.push({ type: 'nav', data: n }));
    return items;
  }, [filteredActions, filteredNavItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (combinedItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % (combinedItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = combinedItems[selectedIndex];
        if (selected) {
          handleSelect(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, combinedItems, selectedIndex, onClose]);

  const handleSelect = (item: { type: 'action' | 'nav'; data: any }) => {
    onClose();
    if (item.type === 'action') {
      if (item.data.action) {
        item.data.action();
      } else if (item.data.href) {
        router.push(item.data.href);
      }
    } else if (item.type === 'nav') {
      router.push(item.data.href);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <Search className="w-5 h-5 text-accent-gold shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, parent domain, or feature keyword..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/40">
            ESC
          </kbd>
        </div>

        {/* Results Stream */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <p className="text-[9px] uppercase font-mono tracking-widest text-accent-gold/70 font-bold px-3 py-1">
                Quick Actions
              </p>
              <div className="space-y-1 mt-1">
                {filteredActions.map((action, i) => {
                  const globalIdx = i;
                  const isSelected = selectedIndex === globalIdx;
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleSelect({ type: 'action', data: action })}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-accent-gold/15 border border-accent-gold/30 text-white'
                          : 'hover:bg-white/[0.03] text-white/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl border ${
                          isSelected 
                            ? 'bg-accent-gold/20 border-accent-gold/40 text-accent-gold' 
                            : 'bg-white/5 border-white/10 text-white/50'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-accent-gold' : 'text-white'}`}>
                            {action.name}
                          </p>
                          <p className="text-[11px] text-white/40 truncate font-sans">
                            {action.desc}
                          </p>
                        </div>
                      </div>
                      {action.badge && (
                        <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-accent-gold/10 border border-accent-gold/20 text-accent-gold shrink-0">
                          {action.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          {filteredNavItems.length > 0 && (
            <div>
              <p className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold px-3 py-1">
                Integrated Domains &amp; Features
              </p>
              <div className="space-y-1 mt-1">
                {filteredNavItems.map((item, i) => {
                  const globalIdx = filteredActions.length + i;
                  const isSelected = selectedIndex === globalIdx;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSelect({ type: 'nav', data: item })}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-accent-gold/15 border border-accent-gold/30 text-white'
                          : 'hover:bg-white/[0.03] text-white/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl border ${
                          isSelected 
                            ? 'bg-accent-gold/20 border-accent-gold/40 text-accent-gold' 
                            : 'bg-white/5 border-white/10 text-white/50'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase font-mono tracking-wider text-accent-gold/80 font-bold">
                              {item.parentHubName}
                            </span>
                            <span className="text-white/20 text-[10px]">→</span>
                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-accent-gold' : 'text-white'}`}>
                              {item.name}
                            </p>
                          </div>
                          <p className="text-[11px] text-white/40 truncate font-sans mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.badge && (
                          <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50">
                            {item.badge}
                          </span>
                        )}
                        <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-accent-gold' : 'text-white/20'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {combinedItems.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-white/40 font-mono">No matching features found.</p>
              <p className="text-xs text-white/20 font-sans mt-1">Try searching for &quot;calendar&quot;, &quot;police&quot;, &quot;turnover&quot;, &quot;whatsapp&quot;, or &quot;scanner&quot;</p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[11px] text-white/30 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">↵</kbd> Select</span>
          </div>
          <span>Nothingness 8-Domain Architecture</span>
        </div>
      </div>
    </div>
  );
}
