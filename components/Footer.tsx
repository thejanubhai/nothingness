'use client';

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const linkClass = "relative group text-white/60 hover:text-white text-[13px] transition-colors duration-300";
  const underlineClass = "absolute -bottom-1 left-0 w-0 h-[1px] bg-accent-gold group-hover:w-full transition-all duration-300";

  return (
    <footer className="w-full bg-black/50 backdrop-blur-xl border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 py-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-5 transition-transform hover:scale-105 duration-300">
              <Image 
                src="/images/logo.png" 
                alt="Nothingness Logo" 
                width={160} 
                height={64} 
                className="object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
              />
            </Link>
            <p className="text-white/40 text-[13px] leading-relaxed max-w-xs">
              India's First & Only Kink & BDSM Hospitality Brand. A culturally relevant, community-driven ecosystem.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30 mb-6">Explore</h4>
            <ul className="flex flex-col gap-3.5">
              <li>
                <Link href="/properties" className={linkClass}>
                  Properties
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/media" className={linkClass}>
                  Press & Media
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <a href="mailto:contact@nothingness.asia" className={linkClass}>
                  Contact
                  <span className={underlineClass} />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30 mb-6">Legal & Info</h4>
            <ul className="flex flex-col gap-3.5">
              <li>
                <Link href="/legal/terms" className={linkClass}>
                  Terms of Service
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className={linkClass}>
                  Privacy Policy
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/cancel" className={linkClass}>
                  Modify or Cancel
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/safety" className={linkClass}>
                  Safety & Sanitation
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className={linkClass}>
                  Accessibility
                  <span className={underlineClass} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Partnership */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30 mb-6">Partnership</h4>
            <ul className="flex flex-col gap-3.5">
              <li>
                <Link href="/franchise" className="relative group text-accent-gold/80 hover:text-accent-gold text-[13px] transition-colors duration-300">
                  Franchise Opportunities
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-accent-gold group-hover:w-full transition-all duration-300" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Safe Area Support */}
        <div className="border-t border-white/5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-white/25 text-[11px] tracking-wide">
            © {new Date().getFullYear()} Nothingness Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-white/25 text-[11px] tracking-[0.15em] uppercase">18+ Only</span>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <span className="text-white/25 text-[11px] tracking-[0.15em] uppercase">ID Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
