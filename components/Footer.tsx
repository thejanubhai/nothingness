'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Tooltip from "./Tooltip";
import { MapPin, Mail, Phone, ShieldCheck } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const linkClass = "relative group text-white/60 hover:text-white text-xs sm:text-[13px] transition-colors duration-300 py-1 inline-block";
  const underlineClass = "absolute -bottom-0.5 left-0 w-0 h-[1px] bg-accent-gold group-hover:w-full transition-all duration-300";

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="w-full bg-black/90 backdrop-blur-2xl border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
        {/* Main Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 py-12 md:py-16">
          {/* Brand Column */}
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

          {/* Legal & Policies (Payment Gateway Required Links) */}
          <div>
            <h4 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 mb-4 sm:mb-6 font-mono">Legal &amp; Policies</h4>
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
                <Link href="/legal/cancellation" className={linkClass}>
                  Cancellation &amp; Refund Policy
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/legal/shipping" className={linkClass}>
                  Shipping &amp; Delivery Policy
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/safety" className={linkClass}>
                  Guest Rules &amp; Safety
                  <span className={underlineClass} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40 mb-4 sm:mb-6 font-mono">Contact &amp; Support</h4>
            <ul className="flex flex-col gap-1.5 sm:gap-2">
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact Concierge
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/franchise" className={linkClass}>
                  Host Partnership
                  <span className={underlineClass} />
                </Link>
              </li>
              <li>
                <Link href="/auth" className={linkClass}>
                  Guest Portal Login
                  <span className={underlineClass} />
                </Link>
              </li>
              <li className="pt-2 text-[11px] text-white/40 font-mono space-y-1">
                <p className="flex items-center gap-1.5 text-zinc-300">
                  <Mail className="w-3 h-3 text-accent-gold" />
                  <a href="mailto:concierge@nothingness.asia" className="hover:text-accent-gold transition-colors">concierge@nothingness.asia</a>
                </p>
                <p className="flex items-center gap-1.5 text-zinc-300">
                  <Phone className="w-3 h-3 text-accent-gold" />
                  <a href="tel:+918527976791" className="hover:text-accent-gold transition-colors">+91 85279 76791</a>
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Operating Address Banner */}
        <div className="border-t border-white/5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-[11px] text-white/40 font-mono">
          <p className="flex items-center gap-1.5 text-zinc-400">
            <MapPin className="w-3.5 h-3.5 text-accent-gold shrink-0" />
            <span><strong>Operating Address:</strong> B-80, Ground Floor, Street 8, Ghaffar Manzil, Jamia Nagar, Okhla, New Delhi - 110025, Delhi, India</span>
          </p>
          <div className="flex items-center gap-2 text-green-400/90 text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256-Bit SSL Secured • RBI Payment Compliant</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/30 text-[11px] tracking-wide text-center sm:text-left">
            © {new Date().getFullYear()} Nothingness. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Tooltip content="Strictly for adults above 18">
              <span className="text-white/30 text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-mono">18+ Only</span>
            </Tooltip>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <Tooltip content="Identity verification required before check-in">
              <span className="text-white/30 text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-mono">Delhi Police Compliant</span>
            </Tooltip>
          </div>
        </div>
      </div>
    </footer>
  );
}
