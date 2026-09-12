'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  X, 
  User, 
  LayoutDashboard, 
  LogOut, 
  Sparkles, 
  Flame, 
  Building2,
  LogIn,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  PhoneCall,
  ChevronRight,
  Handshake,
  MessageSquare,
  Users, 
  Compass, 
  PlusCircle,
  KeyRound,
  Copy,
  Check
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import Magnetic from "./Magnetic";
import AppSwitcher from "./AppSwitcher";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/actions/auth";
import { isUserAdmin } from "@/lib/auth-utils";
import KinksterInboxModal from "./kinkster/KinksterInboxModal";
import CreationActionSheet from "./kinkster/CreationActionSheet";

export interface ActiveContext {
  isLoggedIn: boolean;
  user?: {
    id: string;
    email: string;
    phone: string;
    alias: string;
    avatarUrl: string | null;
    isIdVerified: boolean;
    isLevel2Vetted: boolean;
    isFaceIdVetted: boolean;
    isAdmin: boolean;
  };
  activeStay?: {
    id: string;
    spaceTitle: string;
    spaceSlug: string;
    city: string;
    area: string;
    checkIn: string;
    checkOut: string;
    isTodayOrActive: boolean;
    isVerified: boolean;
    doorPin: string | null;
    needsVerification: boolean;
  } | null;
  activeGathering?: {
    id: string;
    title: string;
    eventDate: string;
    isTonight: boolean;
    qrReady: boolean;
    qrToken: string;
    venue: string;
  } | null;
  unreadCount?: number;
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);
  const pathname = usePathname();

  const isKinksterMode = pathname?.startsWith('/kinksters') || pathname?.startsWith('/sanctuary-pass');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [inboxOpen, setInboxOpen] = useState<boolean>(false);
  const [creationSheetOpen, setCreationSheetOpen] = useState<boolean>(false);

  // Crest logo double-tap & double-click panic camouflage trigger
  const lastLogoTapRef = useRef<number>(0);
  const lastLogoClickRef = useRef<number>(0);

  const dispatchPanicMode = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trigger-panic-mode'));
    }
  };

  const handleLogoTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastLogoTapRef.current;
    if (timeSinceLastTap > 0 && timeSinceLastTap < 350) {
      e.preventDefault();
      e.stopPropagation();
      lastLogoTapRef.current = 0;
      dispatchPanicMode();
    } else {
      lastLogoTapRef.current = now;
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastLogoClickRef.current;
    if (timeSinceLastClick > 0 && timeSinceLastClick < 350) {
      e.preventDefault();
      e.stopPropagation();
      lastLogoClickRef.current = 0;
      dispatchPanicMode();
      return;
    }
    lastLogoClickRef.current = now;
  };

  const handleLogoDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    lastLogoClickRef.current = 0;
    dispatchPanicMode();
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sync auth state & proactive active context across navigations, tab focus, and Supabase auth events
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const fetchActiveContext = async () => {
      try {
        const res = await fetch('/api/user/active-context');
        if (res.ok) {
          const data: ActiveContext = await res.json();
          if (isMounted) {
            setActiveContext(data);
            if (data.unreadCount !== undefined) {
              setUnreadCount(data.unreadCount);
            }
            if (data.isLoggedIn && data.user) {
              setUser(data.user);
            } else {
              setUser(null);
            }
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('active-context-updated', { detail: data }));
          }
        }
      } catch (_) {}
    };

    fetchActiveContext();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchActiveContext();
    });

    const onFocus = () => fetchActiveContext();
    window.addEventListener('focus', onFocus);
    window.addEventListener('refresh-active-context', onFocus);
    window.addEventListener('refresh-unread-count', onFocus);

    // Periodic heartbeat to keep proactive pill updated
    const interval = setInterval(fetchActiveContext, 30000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('refresh-active-context', onFocus);
      window.removeEventListener('refresh-unread-count', onFocus);
    };
  }, [pathname]);

  // Listen for custom events to trigger inbox drawer or creation sheet
  useEffect(() => {
    const handleOpenMessages = () => setInboxOpen(true);
    const handleOpenCreation = () => setCreationSheetOpen(true);
    window.addEventListener('open-kinkster-messages', handleOpenMessages);
    window.addEventListener('open-creation-sheet', handleOpenCreation);
    return () => {
      window.removeEventListener('open-kinkster-messages', handleOpenMessages);
      window.removeEventListener('open-creation-sheet', handleOpenCreation);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Format phone or email for display
  const userPhone = user?.phone || (user?.email?.includes('@auth.nothingness') ? `+${user.email.split('@')[0]}` : user?.email || '');
  const isAdmin = isUserAdmin(user);

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 pt-[env(safe-area-inset-top)] ${
          isScrolled || pathname !== '/'
            ? "bg-black/85 backdrop-blur-2xl border-b border-white/[0.07] py-2.5 shadow-lg shadow-black/40"
            : "bg-transparent py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center">
          {/* Left: Brand Crest Logo with proper breathing room */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              id="header-crest-logo"
              data-testid="header-crest-logo"
              onTouchStart={handleLogoTouchStart}
              onClick={handleLogoClick}
              onDoubleClick={handleLogoDoubleClick}
              className="flex items-center justify-center transition-transform hover:scale-105 duration-300 select-none cursor-pointer"
              title="Nothingness • Double-tap for stealth mode"
            >
              <Image 
                src="/images/logo.png" 
                alt="Nothingness Logo" 
                width={82} 
                height={32} 
                className="object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] pointer-events-none" 
                priority
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {isKinksterMode ? (
              <>
                <Link 
                  href="/kinksters" 
                  className={`text-[12px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 relative group py-2 ${
                    pathname === '/kinksters' ? 'text-rose-400 font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Feed
                  {pathname === '/kinksters' && <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-rose-500" />}
                </Link>
                <Link 
                  href="/kinksters/events" 
                  className={`text-[12px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 relative group py-2 flex items-center gap-1 ${
                    pathname.startsWith('/kinksters/events') ? 'text-amber-300 font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Events ✨
                  {pathname.startsWith('/kinksters/events') && <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-amber-400" />}
                </Link>
                <button
                  type="button"
                  onClick={() => setCreationSheetOpen(true)}
                  className="text-[12px] font-medium tracking-[0.2em] uppercase text-rose-400 hover:text-rose-300 transition-colors py-2 flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
                <Link 
                  href="/kinksters/groups" 
                  className={`text-[12px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 relative group py-2 flex items-center gap-1 ${
                    pathname.startsWith('/kinksters/groups') ? 'text-purple-300 font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Groups
                  {pathname.startsWith('/kinksters/groups') && <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-purple-400" />}
                </Link>
                <Link 
                  href="/kinksters/explore" 
                  className={`text-[12px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 relative group py-2 flex items-center gap-1 ${
                    pathname.startsWith('/kinksters/explore') || pathname.startsWith('/kinksters/discover') ? 'text-accent-gold font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Explore
                  {(pathname.startsWith('/kinksters/explore') || pathname.startsWith('/kinksters/discover')) && <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-accent-gold" />}
                </Link>

                {/* Top-Right Messages Button on Desktop */}
                <button
                  type="button"
                  onClick={() => setInboxOpen(true)}
                  className="relative px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  title="Sanctuary Messages"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold shadow-[0_0_6px_rgba(225,29,72,0.8)]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </>
            ) : user ? (
              /* Logged In Desktop Experience */
              <>
                <Link 
                  href="/spaces" 
                  className={`text-[12px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 relative group py-2 ${
                    pathname.startsWith('/spaces') ? 'text-accent-gold font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Suites
                  {pathname.startsWith('/spaces') && <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-accent-gold" />}
                </Link>

                <Link 
                  href="/sanctuary-pass" 
                  className={`text-[12px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 relative group py-2 flex items-center gap-1 ${
                    pathname.startsWith('/sanctuary-pass') ? 'text-amber-400 font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Gatherings ✨
                  {pathname.startsWith('/sanctuary-pass') && <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-amber-400" />}
                </Link>

                <Link 
                  href="/kinksters" 
                  className={`text-[12px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 relative group py-2 flex items-center gap-1 ${
                    pathname.startsWith('/kinksters') ? 'text-rose-400 font-bold' : 'text-rose-400/90 hover:text-rose-300'
                  }`}
                >
                  The Circle ✦
                  {pathname.startsWith('/kinksters') && <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-rose-500" />}
                </Link>

                {/* Living Proactive Status Pill for Logged-In Member */}
                {activeContext?.activeStay?.isTodayOrActive && activeContext.activeStay.doorPin ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-white truncate max-w-[100px]">{activeContext.activeStay.spaceTitle}</span>
                    <span className="font-bold text-emerald-300 tracking-wider">PIN {activeContext.activeStay.doorPin}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard.writeText(activeContext.activeStay?.doorPin || '');
                        toast.success(`Door PIN copied: ${activeContext.activeStay?.doorPin}`);
                      }}
                      className="p-1 hover:bg-emerald-500/20 rounded transition-colors text-emerald-400 hover:text-white cursor-pointer"
                      title="Copy Door PIN"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ) : activeContext?.activeStay?.isTodayOrActive && activeContext.activeStay.needsVerification ? (
                  <Link
                    href="/onboarding"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-[11px] font-mono shadow-[0_0_12px_rgba(245,158,11,0.2)] transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-white truncate max-w-[120px]">ID Check for {activeContext.activeStay.spaceTitle}</span>
                    <ChevronRight className="w-3 h-3 text-amber-400" />
                  </Link>
                ) : activeContext?.activeGathering?.isTonight ? (
                  <Link
                    href="/sanctuary-pass"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25 text-[11px] font-mono shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-semibold text-white truncate max-w-[110px]">{activeContext.activeGathering.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 font-bold uppercase">Pass Live</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/80 text-[11px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-white font-medium">@{activeContext?.user?.alias || user?.alias || 'member'}</span>
                    {activeContext?.user?.isLevel2Vetted ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent-gold/20 text-accent-gold border border-accent-gold/40 font-bold">L2</span>
                    ) : activeContext?.user?.isIdVerified ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">Vetted</span>
                    ) : null}
                  </div>
                )}
              </>
            ) : (
              /* Non-Logged In (Public) Desktop Experience: 3 Clear Pillars + OTA Check-In */
              <>
                <Link 
                  href="/spaces" 
                  className={`text-[12px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 relative group py-2 ${
                    pathname.startsWith('/spaces') ? 'text-accent-gold font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Suites &amp; Stays
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-accent-gold group-hover:w-full transition-all duration-300" />
                </Link>

                <Link 
                  href="/sanctuary-pass" 
                  className={`text-[12px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 relative group py-2 flex items-center gap-1 ${
                    pathname.startsWith('/sanctuary-pass') ? 'text-amber-400 font-bold' : 'text-amber-400/90 hover:text-amber-300'
                  }`}
                >
                  Gatherings ✨
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-400 group-hover:w-full transition-all duration-300" />
                </Link>

                <Link 
                  href="/kinksters" 
                  className={`text-[12px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 relative group py-2 flex items-center gap-1 ${
                    pathname.startsWith('/kinksters') ? 'text-rose-400 font-bold' : 'text-rose-400/90 hover:text-rose-300'
                  }`}
                >
                  The Circle ✦
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-rose-500 group-hover:w-full transition-all duration-300" />
                </Link>

                <Link 
                  href="/onboarding" 
                  className="text-[12px] font-medium tracking-[0.2em] uppercase text-zinc-400 hover:text-white transition-colors duration-300 relative group py-2 flex items-center gap-1"
                >
                  OTA Check-In
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-zinc-400 group-hover:w-full transition-all duration-300" />
                </Link>
              </>
            )}
            
            {/* Desktop Ecosystem Switcher */}
            <AppSwitcher user={user} />

            <Magnetic>
              {user ? (
                <Link
                  href={isAdmin ? "/admin" : "/dashboard"}
                  className="text-[12px] font-bold tracking-[0.15em] uppercase text-black bg-accent-gold hover:bg-white transition-all duration-300 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{isAdmin ? "Command Center" : "Member Vault"}</span>
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="text-[12px] font-bold tracking-[0.15em] uppercase text-black bg-gradient-to-r from-amber-500 via-amber-400 to-accent-gold hover:to-white transition-all duration-300 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Join</span>
                </Link>
              )}
            </Magnetic>
          </nav>

          {/* Mobile Right Controls: Ultra-clean, native 36px circular icon cluster */}
          <div className="flex md:hidden items-center gap-2">
            {/* Live Door PIN quick button if active stay */}
            {activeContext?.activeStay?.doorPin && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeContext.activeStay?.doorPin || '');
                  toast.success(`Door PIN copied: ${activeContext.activeStay?.doorPin}`);
                }}
                className="h-9 px-2.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer"
                title="Tap to copy Door PIN"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>{activeContext.activeStay.doorPin}</span>
              </button>
            )}

            {/* Top-Right Native Messages Icon Button in Kinkster Mode */}
            {isKinksterMode && (
              <button
                type="button"
                onClick={() => setInboxOpen(true)}
                className="relative w-9 h-9 flex items-center justify-center rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 active:scale-95 transition-all touch-manipulation shadow-sm cursor-pointer"
                title="Sanctuary Messages"
                aria-label="Sanctuary Messages"
              >
                <MessageSquare className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-mono font-bold flex items-center justify-center border-2 border-black shadow-[0_0_8px_rgba(225,29,72,0.8)]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* App Switcher (compact circular icon button) */}
            <AppSwitcher user={user} />

            {/* User Profile Avatar / Portal Button */}
            {user ? (
              <Link
                href={isAdmin ? "/admin" : "/dashboard"}
                title={isAdmin ? "Command Center" : "Member Vault"}
                aria-label={isAdmin ? "Admin Center" : "Member Vault"}
                className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-accent-gold/40 text-accent-gold active:scale-95 transition-all touch-manipulation shadow-sm group"
              >
                {isAdmin ? (
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                ) : (
                  <User className="w-4 h-4 text-accent-gold group-hover:scale-110 transition-transform" />
                )}
                {/* Active live presence status dot */}
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-black shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              </Link>
            ) : (
              <Link
                href="/auth"
                className="h-9 px-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-accent-gold text-black font-bold text-[11px] uppercase font-mono tracking-wider shadow-sm active:scale-95 transition-all touch-manipulation"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 flex items-center justify-center text-white rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-4 h-4 text-accent-gold" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Upgraded Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-3xl flex flex-col justify-between overflow-y-auto px-4 sm:px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          >
            {/* Top Navigation Row in Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <Link 
                href="/" 
                id="drawer-crest-logo"
                data-testid="drawer-crest-logo"
                onTouchStart={(e) => {
                  handleLogoTouchStart(e);
                  if (lastLogoTapRef.current === 0) {
                    setMobileOpen(false);
                  }
                }}
                onClick={(e) => {
                  handleLogoClick(e);
                  setMobileOpen(false);
                }}
                onDoubleClick={(e) => {
                  handleLogoDoubleClick(e);
                  setMobileOpen(false);
                }}
                className="cursor-pointer select-none"
              >
                <Image 
                  src="/images/logo.png" 
                  alt="Nothingness" 
                  width={75} 
                  height={30} 
                  className="object-contain drop-shadow-[0_0_12px_rgba(220,38,38,0.5)] pointer-events-none" 
                />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:text-accent-gold transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 space-y-4 max-w-md mx-auto w-full">
              {/* Top Hero Card: Logged In vs Sign In / Sign Up */}
              {user ? (
                <div className="p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-gold/20 border border-accent-gold/40 flex items-center justify-center text-accent-gold">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white font-mono">
                            @{activeContext?.user?.alias || (user?.email ? user.email.split('@')[0] : 'member')}
                          </span>
                          {activeContext?.user?.isLevel2Vetted ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent-gold/20 text-accent-gold border border-accent-gold/40 font-bold">L2 Vetted</span>
                          ) : activeContext?.user?.isIdVerified ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">ID Vetted</span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[190px]">{userPhone}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                      Active
                    </span>
                  </div>

                  {/* Active Stay Door PIN Quick Card inside Drawer */}
                  {activeContext?.activeStay?.isTodayOrActive && (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate max-w-[200px]">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                          {activeContext.activeStay.spaceTitle}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          Today's Stay
                        </span>
                      </div>
                      {activeContext.activeStay.doorPin ? (
                        <div className="flex items-center justify-between bg-black/60 px-3 py-2 rounded-lg border border-emerald-500/20">
                          <div>
                            <span className="text-[9px] text-zinc-400 uppercase font-mono block">Door Lock PIN</span>
                            <span className="text-base font-mono font-bold text-emerald-300 tracking-wider">
                              {activeContext.activeStay.doorPin}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(activeContext.activeStay?.doorPin || '');
                              toast.success(`Door PIN copied: ${activeContext.activeStay?.doorPin}`);
                            }}
                            className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                      ) : activeContext.activeStay.needsVerification ? (
                        <Link
                          href="/onboarding"
                          onClick={() => setMobileOpen(false)}
                          className="block w-full py-2 px-3 text-center bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold rounded-lg"
                        >
                          Complete ID Check to Unlock Door PIN →
                        </Link>
                      ) : null}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={isAdmin ? "/admin" : "/dashboard"}
                      onClick={() => setMobileOpen(false)}
                      className="py-2.5 px-3 bg-accent-gold hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>{isAdmin ? "Admin Center" : "Member Vault"}</span>
                    </Link>

                    <form action={signOut} className="w-full">
                      <button
                        type="submit"
                        onClick={() => setMobileOpen(false)}
                        className="w-full py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl shadow-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Guest &amp; Member Portal</h4>
                      <p className="text-[11px] text-zinc-400">Fast 1-tap OTP • Access passes, bookings &amp; circle</p>
                    </div>
                  </div>

                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-accent-gold hover:from-amber-400 hover:to-white text-black font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <LogIn className="w-4 h-4 text-black" />
                    <span>Login / Sign Up with Phone OTP →</span>
                  </Link>
                </div>
              )}

              {/* Core Experiences Section */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 px-1">Experiences &amp; Stays</span>
                
                <div className="grid grid-cols-1 gap-2">
                  <Link
                    href="/onboarding"
                    onClick={() => setMobileOpen(false)}
                    className="p-3 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-xl flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white">Guest Check-In &amp; Onboarding</h4>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300">Fast Pass</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">Airbnb / MMT / Agoda / Direct</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/spaces"
                    onClick={() => setMobileOpen(false)}
                    className="p-3 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/90 rounded-xl flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-accent-gold">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Suites &amp; Sanctuaries</h4>
                        <p className="text-[10px] text-zinc-400 font-mono">Autonomous suites &amp; dungeons</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </Link>

                  <Link
                    href="/sanctuary-pass"
                    onClick={() => setMobileOpen(false)}
                    className="p-3 bg-zinc-900/80 hover:bg-zinc-900 border border-amber-500/25 rounded-xl flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-amber-300">Sanctuary Gatherings</h4>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300">Secret Vault</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">Munches, Masquerades &amp; Soirées</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-500/60 group-hover:text-amber-300 transition-colors" />
                  </Link>

                  <Link
                    href="/kinksters"
                    onClick={() => setMobileOpen(false)}
                    className="p-3 bg-zinc-900/80 hover:bg-zinc-900 border border-rose-500/25 rounded-xl flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-rose-300">The Circle</h4>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300">18+ Circle</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">Anonymous @Alias feed, desires &amp; stories</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-500/60 group-hover:text-rose-300 transition-colors" />
                  </Link>
                </div>
              </div>

              {/* Editorial & Information List */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 px-1">Discover &amp; Support</span>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/journal"
                    onClick={() => setMobileOpen(false)}
                    className="p-2.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 rounded-xl flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                    <span>Journal</span>
                  </Link>

                  <Link
                    href="/franchise"
                    onClick={() => setMobileOpen(false)}
                    className="p-2.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 rounded-xl flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    <Handshake className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Host Partner</span>
                  </Link>

                  <Link
                    href="/faq"
                    onClick={() => setMobileOpen(false)}
                    className="p-2.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 rounded-xl flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>FAQ</span>
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="p-2.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 rounded-xl flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Concierge</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Compliance & Brand Tag */}
            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-400 max-w-md mx-auto w-full">
              <span>Nothingness • 100% Discretion</span>
              <Link href="/about" onClick={() => setMobileOpen(false)} className="hover:text-accent-gold transition-colors">
                The Philosophy →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kinkster Mode Unified Messaging Slide-Over Drawer */}
      {isKinksterMode && (
        <KinksterInboxModal
          isOpen={inboxOpen}
          onClose={() => {
            setInboxOpen(false);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('refresh-active-context'));
            }
          }}
          onRefreshUnread={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('refresh-active-context'));
            }
          }}
        />
      )}

      {/* Kinkster Mode Native Creation Action Sheet */}
      {isKinksterMode && (
        <CreationActionSheet
          isOpen={creationSheetOpen}
          onClose={() => setCreationSheetOpen(false)}
          userAlias={user?.email ? user.email.split('@')[0] : 'member'}
        />
      )}
    </>
  );
}
