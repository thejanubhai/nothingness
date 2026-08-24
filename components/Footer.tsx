'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Tooltip from "./Tooltip";

export default function Footer() {
  const pathname = usePathname();
  const linkClass = "relative group text-white/60 hover:text-white text-xs sm:text-[13px] transition-colors duration-300 py-1 inline-block";
  const underlineClass = "absolute -bottom-0.5 left-0 w-0 h-[1px] bg-accent-gold group-hover:w-full transition-all duration-300";

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="w-full bg-black/80 backdrop-blur-2xl border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
        {/* Main Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 py-12 md:py-16">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="inline-block transition-transform hover:scale-105 duration-300">
              <Image 
                src="/images/logo.png" 
                alt="Nothingness Logo" 
                width={140} 
                height={56} 
                className="object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
              />
            </Link>
            <p className="text-white/40 text-xs sm:text-[13px] leading-relaxed max-w-xs">
              India's Premier Alternate Lifestyle &amp; Luxury Sanctuary Brand. A culturally relevant, high-design hospitality ecosystem.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 mb-4 sm:mb-6 font-mono">Explore</h4>
            <ul className="flex flex-col gap-1.5 sm:gap-2">
              <li>
                <Link href="/spaces" className={linkClass}>
                  Spaces &amp; Sanctuaries
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/kinksters" className={linkClass}>
                  Lifestyle 🔥
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/about" className={linkClass}>
                  The Philosophy
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/journal" className={linkClass}>
                  Editorial Journal
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/faq" className={linkClass}>
                  FAQ
                  <span className={underlineClass} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 mb-4 sm:mb-6 font-mono">Legal &amp; Safety</h4>
            <ul className="flex flex-col gap-1.5 sm:gap-2">
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
                  Cancellation Policy
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/safety" className={linkClass}>
                  Safety &amp; Protocols
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
            <h4 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 mb-4 sm:mb-6 font-mono">Partnership</h4>
            <ul className="flex flex-col gap-1.5 sm:gap-2">
              <li>
                <Link href="/franchise" className={linkClass}>
                  Franchise &amp; Host
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/media" className={linkClass}>
                  Press &amp; Media Kit
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact Concierge
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/auth" className={linkClass}>
                  Guest Portal Login
                  <span className={underlineClass} />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Safe Area Support */}
        <div className="border-t border-white/5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/30 text-[11px] tracking-wide text-center sm:text-left">
            © {new Date().getFullYear()} Nothingness Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Tooltip content="Strictly for adults above 18">
              <span className="text-white/30 text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-mono">18+ Only</span>
            </Tooltip>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <Tooltip content="Identity verification required before check-in">
              <span className="text-white/30 text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-mono">Delhi Police Verified</span>
            </Tooltip>
          </div>
        </div>
      </div>
    </footer>
  );
}
