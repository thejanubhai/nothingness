'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
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
  Handshake
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Magnetic from "./Magnetic";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/actions/auth";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
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

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 pt-[env(safe-area-inset-top)] ${
          isScrolled
            ? "bg-black/80 backdrop-blur-2xl border-b border-white/5 py-2.5"
            : "bg-transparent py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center justify-center transition-transform hover:scale-105 duration-300"
          >
            <Image 
              src="/images/logo.png" 
              alt="Nothingness Logo" 
              width={80} 
              height={32} 
              className="object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/spaces" className="text-[12px] font-medium tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors duration-300 relative group py-2">
              Spaces
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-accent-gold group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/sanctuary-pass" className="text-[12px] font-medium tracking-[0.2em] uppercase text-amber-400/90 hover:text-amber-300 transition-colors duration-300 relative group py-2 flex items-center gap-1">
              Sanctuary Pass ✨
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-400 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/kinksters" className="text-[12px] font-medium tracking-[0.2em] uppercase text-rose-400/90 hover:text-rose-400 transition-colors duration-300 relative group py-2 flex items-center gap-1">
              Lifestyle 🔥
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-rose-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/journal" className="text-[12px] font-medium tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors duration-300 relative group py-2">
              Journal
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-accent-gold group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/franchise" className="text-[12px] font-medium tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors duration-300 relative group py-2">
              Partner
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-accent-gold group-hover:w-full transition-all duration-300" />
            </Link>
            
            <Magnetic>
              {user ? (
                <Link
                  href="/dashboard"
                  className="text-[12px] font-bold tracking-[0.15em] uppercase text-black bg-accent-gold hover:bg-white transition-all duration-300 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="text-[12px] font-medium tracking-[0.2em] uppercase text-accent-gold/80 hover:text-accent-gold transition-colors duration-300 border border-accent-gold/30 px-4 py-2 rounded-full hover:bg-accent-gold/10"
                >
                  Guest Portal
                </Link>
              )}
            </Magnetic>
          </nav>

          {/* Mobile Right Controls (Quick Login + Menu Toggle) */}
          <div className="flex md:hidden items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-gold/15 border border-accent-gold/30 text-accent-gold text-[11px] font-mono font-bold"
              >
                <User className="w-3.5 h-3.5" />
                <span>Portal</span>
              </Link>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-[11px] uppercase tracking-wider shadow-md active:scale-95 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-10 h-10 flex items-center justify-center text-white rounded-full bg-white/5 border border-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5 text-accent-gold" /> : <Menu className="w-5 h-5" />}
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
              <Link href="/" onClick={() => setMobileOpen(false)}>
                <Image 
                  src="/images/logo.png" 
                  alt="Nothingness" 
                  width={75} 
                  height={30} 
                  className="object-contain drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]" 
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
                        <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono block">Logged In Guest</span>
                        <p className="text-sm font-bold text-white font-mono truncate max-w-[190px]">{userPhone}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="py-2.5 px-3 bg-accent-gold hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Dashboard</span>
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
                    href="/spaces"
                    onClick={() => setMobileOpen(false)}
                    className="p-3 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/90 rounded-xl flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-accent-gold">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Spaces &amp; Sanctuaries</h4>
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
                          <h4 className="text-sm font-bold text-amber-300">Sanctuary Pass</h4>
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
                          <h4 className="text-sm font-bold text-rose-300">Lifestyle Circle</h4>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300">18+ Circle</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">Anonymous @Alias feed &amp; stories</p>
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
    </>
  );
}
