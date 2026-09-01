'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LayoutDashboard, LogOut, Sparkles, Flame, Building2 } from "lucide-react";
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
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex justify-between items-center">
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

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-11 h-11 flex items-center justify-center text-white rounded-full bg-white/5 border border-white/10 active:scale-95 transition-all"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5 text-accent-gold" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Full-Screen Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-3xl flex flex-col justify-between p-6 pt-28 pb-[calc(2rem+env(safe-area-inset-bottom))] overflow-y-auto"
          >
            <div className="flex flex-col space-y-3.5 text-center w-full max-w-sm mx-auto">
              {user && (
                <div className="mb-2 p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold font-mono text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Logged In Guest</p>
                      <p className="text-xs text-white font-mono font-bold truncate max-w-[170px]">{userPhone}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="text-[10px] uppercase font-mono tracking-wider text-accent-gold hover:underline"
                  >
                    View Portal →
                  </Link>
                </div>
              )}

              <Link href="/" className="text-2xl font-serif text-white hover:text-accent-gold transition-colors py-1.5 border-b border-white/5" onClick={() => setMobileOpen(false)}>
                Home
              </Link>
              <Link href="/spaces" className="text-2xl font-serif text-white hover:text-accent-gold transition-colors py-1.5 border-b border-white/5" onClick={() => setMobileOpen(false)}>
                Spaces &amp; Sanctuaries
              </Link>
              <Link href="/sanctuary-pass" className="text-2xl font-serif text-amber-400 hover:text-amber-300 transition-colors py-1.5 border-b border-white/5 flex items-center justify-center gap-2" onClick={() => setMobileOpen(false)}>
                Sanctuary Pass ✨
              </Link>
              <Link href="/kinksters" className="text-2xl font-serif text-rose-400 hover:text-rose-300 transition-colors py-1.5 border-b border-white/5 flex items-center justify-center gap-2" onClick={() => setMobileOpen(false)}>
                Lifestyle 🔥
              </Link>
              <Link href="/franchise" className="text-xl font-serif text-white/80 hover:text-accent-gold transition-colors py-1" onClick={() => setMobileOpen(false)}>
                Partner &amp; Franchise
              </Link>
              <Link href="/about" className="text-xl font-serif text-white/80 hover:text-accent-gold transition-colors py-1" onClick={() => setMobileOpen(false)}>
                The Philosophy
              </Link>
              <Link href="/journal" className="text-xl font-serif text-white/80 hover:text-accent-gold transition-colors py-1" onClick={() => setMobileOpen(false)}>
                Journal
              </Link>
              <Link href="/faq" className="text-xl font-serif text-white/80 hover:text-accent-gold transition-colors py-1" onClick={() => setMobileOpen(false)}>
                FAQ
              </Link>
              <Link href="/contact" className="text-xl font-serif text-white/80 hover:text-accent-gold transition-colors py-1" onClick={() => setMobileOpen(false)}>
                Contact Concierge
              </Link>
            </div>

            <div className="w-full max-w-sm mx-auto pt-4 space-y-2">
              {user ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="w-full block py-3.5 bg-accent-gold text-black font-bold text-xs tracking-widest uppercase rounded-2xl shadow-xl text-center" 
                    onClick={() => setMobileOpen(false)}
                  >
                    My Sanctuary Dashboard
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      onClick={() => setMobileOpen(false)}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-red-400 text-xs font-mono tracking-wider rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </form>
                </>
              ) : (
                <Link 
                  href="/auth" 
                  className="w-full block py-4 bg-gradient-to-r from-accent-gold to-amber-600 text-black font-bold text-xs tracking-widest uppercase rounded-2xl shadow-xl text-center" 
                  onClick={() => setMobileOpen(false)}
                >
                  Guest Portal Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
