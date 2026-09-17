'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import CommandPalette from './CommandPalette';
import MobileNav from './MobileNav';
import AdminSubNav from './ui/AdminSubNav';

interface AdminShellProps {
  userEmail?: string;
  children: React.ReactNode;
}

export default function AdminShell({ userEmail, children }: AdminShellProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-black text-foreground selection:bg-accent-gold/30 w-full relative flex flex-col">
      {/* Mobile Bar & Drawer */}
      <MobileNav />

      {/* Desktop Sidebar with Active Navigation State */}
      <AdminSidebar 
        userEmail={userEmail} 
        onOpenCommandPalette={() => setIsCommandOpen(true)} 
      />

      {/* Main Content Area */}
      <div className="md:pl-64 flex-1 flex flex-col min-h-screen w-full">
        {/* Desktop Sticky Header with Breadcrumbs and Quick Actions */}
        <AdminHeader onOpenCommandPalette={() => setIsCommandOpen(true)} />

        {/* Tier 2: Sticky In-Page Domain Sub-Navigation */}
        <AdminSubNav />

        <main className="flex-1 relative w-full">
          <div className="fixed inset-0 bg-grain opacity-[0.02] pointer-events-none z-0" />
          <div className="min-h-full p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto relative z-10 pb-16 md:pb-24">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette 
        isOpen={isCommandOpen} 
        onClose={() => setIsCommandOpen(false)} 
      />
    </div>
  );
}
