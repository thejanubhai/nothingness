'use client';

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-black/50 backdrop-blur-xl border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 py-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-serif text-2xl tracking-[0.2em] uppercase text-white hover:text-accent-gold transition-colors duration-300 block mb-5">
              Nothingness
            </Link>
            <p className="text-white/40 text-[13px] leading-relaxed max-w-xs">
              India's First & Only Kink & BDSM Hospitality Brand. A culturally relevant, community-driven ecosystem.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30 mb-6">Explore</h4>
            <ul className="flex flex-col gap-3.5">
              <li><Link href="/properties" className="text-white/60 hover:text-white text-[13px] transition-colors duration-300">Properties</Link></li>
              <li><Link href="/media" className="text-white/60 hover:text-white text-[13px] transition-colors duration-300">Press & Media</Link></li>
              <li><a href="mailto:contact@nothingness.asia" className="text-white/60 hover:text-white text-[13px] transition-colors duration-300">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30 mb-6">Legal</h4>
            <ul className="flex flex-col gap-3.5">
              <li><Link href="/legal/terms" className="text-white/60 hover:text-white text-[13px] transition-colors duration-300">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="text-white/60 hover:text-white text-[13px] transition-colors duration-300">Privacy Policy</Link></li>
              <li><Link href="/legal/cancellation" className="text-white/60 hover:text-white text-[13px] transition-colors duration-300">Cancellation & Refunds</Link></li>
              <li><Link href="/legal/liability" className="text-white/60 hover:text-white text-[13px] transition-colors duration-300">Guest Rules</Link></li>
            </ul>
          </div>

          {/* Partnership */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30 mb-6">Partnership</h4>
            <ul className="flex flex-col gap-3.5">
              <li><Link href="/franchise" className="text-accent-gold/80 hover:text-accent-gold text-[13px] transition-colors duration-300">Franchise Opportunities</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 py-6 flex flex-col md:flex-row justify-between items-center gap-3">
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
