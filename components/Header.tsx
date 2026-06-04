'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Magnetic from "./Magnetic";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
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
            <Link href="/franchise" className="text-[12px] font-medium tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors duration-300 relative group py-2">
              Franchise
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-accent-gold group-hover:w-full transition-all duration-300" />
            </Link>
            <Magnetic>
              <Link
                href="/auth"
                className="text-[12px] font-medium tracking-[0.2em] uppercase text-accent-gold/80 hover:text-accent-gold transition-colors duration-300 border border-accent-gold/30 px-4 py-2 rounded-full hover:bg-accent-gold/10"
              >
                Guest Portal
              </Link>
            </Magnetic>
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Full-Screen Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-10"
          >
            <div className="flex flex-col space-y-8 mt-12 text-center">
              <Link href="/" className="text-2xl font-serif text-white hover:text-accent-gold transition-colors" onClick={() => setMobileOpen(false)}>
                Home
              </Link>
              <Link href="/spaces" className="text-2xl font-serif text-white hover:text-accent-gold transition-colors" onClick={() => setMobileOpen(false)}>
                Spaces
              </Link>
              <Link href="/about" className="text-2xl font-serif text-white hover:text-accent-gold transition-colors" onClick={() => setMobileOpen(false)}>
                About
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
