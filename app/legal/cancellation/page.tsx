import { Metadata } from 'next';
import Link from 'next/link';
import JsonLd, { generateBreadcrumbSchema } from '@/components/JsonLd';
import { RefreshCw, Building2, MapPin, Mail, Phone, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy | Nothingness',
  description:
    'Official cancellation guidelines, refund processing timelines, modification rules, and customer recourse for Nothingness private sanctuaries and events operated by Sheikh Arsalan Ullah Chishti in New Delhi, India.',
  alternates: {
    canonical: 'https://nothingness.asia/legal/cancellation',
  },
  openGraph: {
    title: 'Cancellation & Refund Policy | Nothingness',
    description: 'Official reservation cancellation rules and refund processing timelines.',
    url: 'https://nothingness.asia/legal/cancellation',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function CancellationPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Cancellation Policy', url: '/legal/cancellation' },
  ];

  return (
    <main className="min-h-screen pt-36 pb-24 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto text-zinc-300">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="cancellation-breadcrumb-schema" />

      {/* Header */}
      <div className="border-b border-zinc-800 pb-8 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-gold/10 border border-accent-gold/20 rounded-full text-[10px] font-mono text-accent-gold mb-4 uppercase tracking-widest">
          <RefreshCw className="w-3 h-3" />
          Transparent Policies
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-3 tracking-tight">
          Cancellation &amp; Refund Policy
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono">
          Last Updated: August 2026 • Clear &amp; Fair Guest Terms
        </p>
      </div>

      {/* Business Entity Notice Box */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 mb-10 text-xs sm:text-sm space-y-3">
        <div className="flex items-center gap-2 text-accent-gold font-bold uppercase tracking-wider text-[11px] font-mono">
          <Building2 className="w-4 h-4" /> Merchant &amp; Operator Details
        </div>
        <p className="leading-relaxed text-zinc-300">
          This Cancellation &amp; Refund Policy applies to all bookings made on{' '}
          <a href="https://nothingness.asia" className="text-accent-gold underline">https://nothingness.asia</a>, owned and operated by{' '}
          <strong className="text-white">SHEIKH ARSALAN ULLAH CHISHTI</strong>, trading as{' '}
          <strong className="text-white">Nothingness</strong> (Business Category:{' '}
          <span className="text-accent-gold font-medium">Hotels and Events</span>).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-xs text-zinc-400 font-mono">
          <p className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent-gold shrink-0 mt-0.5" />
            <span>B-80, Ground Floor, Street 8, Ghaffar Manzil, Jamia Nagar, Okhla, New Delhi - 110025, Delhi, India</span>
          </p>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-accent-gold shrink-0" />
              <a href="mailto:concierge@nothingness.asia" className="hover:text-white transition-colors">concierge@nothingness.asia</a>
            </p>
            <p className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-accent-gold shrink-0" />
              <a href="tel:+918527976791" className="hover:text-white transition-colors">+91 85279 76791</a>
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm sm:text-base leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            1. Overview
          </h2>
          <p>
            Because Nothingness operates exclusive, single-party sanctuaries and private event venues with strictly limited inventory, dates are held exclusively for the reserving party upon payment confirmation. Our cancellation and refund rules are structured to provide fair notice to both guests and sanctuary hosts.
          </p>
        </section>

        {/* Refund Tiers Table */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            2. Cancellation Timeline &amp; Refund Slabs
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose">
            <div className="bg-zinc-900/90 border border-green-500/30 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-green-400 font-mono text-xs font-bold uppercase">
                <span>14+ Days Notice</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-2xl font-bold text-white">100% Refund</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Full refund of the total booking tariff if cancelled at least 14 days prior to the scheduled check-in time (14:00 IST).
              </p>
            </div>

            <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-amber-400 font-mono text-xs font-bold uppercase">
                <span>7 to 13 Days Notice</span>
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-2xl font-bold text-white">50% Refund</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                50% refund of the total booking amount if cancelled between 7 and 13 days prior to the scheduled check-in time.
              </p>
            </div>

            <div className="bg-zinc-900/90 border border-red-500/30 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-red-400 font-mono text-xs font-bold uppercase">
                <span>&lt; 7 Days Notice</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="text-2xl font-bold text-white">No Refund</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Non-refundable if cancelled less than 7 days prior to check-in or in case of a no-show.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            3. Refund Processing &amp; Settlement Timeframe
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
            <p className="text-sm font-semibold text-white">
              ⏱️ Turnaround Time: 5 to 7 Business Days
            </p>
            <p className="text-xs sm:text-sm text-zinc-300">
              Upon approval of a cancellation request, refunds are automatically initiated via our payment aggregator (<strong className="text-white">PayU Payments</strong>). The refunded amount is credited directly back to the <strong className="text-white">original source payment method</strong> (UPI account, Bank Account via Net Banking, or Credit/Debit Card).
            </p>
            <p className="text-xs text-zinc-400">
              Depending on your issuing bank, the funds typically reflect in your account within <strong className="text-zinc-200">5 to 7 working days</strong> from the date of cancellation confirmation.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            4. Step-by-Step Cancellation Process
          </h2>
          <p>Guests can cancel a reservation through any of the following methods:</p>
          <ol className="list-decimal pl-5 space-y-2 text-zinc-300">
            <li>
              <strong>Self-Service Dashboard:</strong> Log in to the <Link href="/auth" className="text-accent-gold underline">Nothingness Portal</Link>, navigate to <em>Bookings</em>, select the active reservation, and click <em>Cancel Booking</em>.
            </li>
            <li>
              <strong>Direct Booking Link:</strong> Click the reservation management link provided in your instant booking confirmation Email / SMS voucher.
            </li>
            <li>
              <strong>Email Support:</strong> Send an email from your registered email address to <a href="mailto:concierge@nothingness.asia" className="text-accent-gold underline">concierge@nothingness.asia</a> with your <strong>Booking ID</strong> and reason for cancellation.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            5. Sanctuary Pass &amp; Gathering Ticket Policies
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li><strong>Lifetime Sanctuary Pass:</strong> The 1-time Sanctuary Pass access fee (₹1,499) is non-refundable once activated.</li>
            <li><strong>Per-Event Hospitality Tickets:</strong> All gathering ticket reservations are strictly non-refundable due to curated capacity caps and dynamic gender-ratio balancing.</li>
            <li><strong>Slot Release / Drop-Out:</strong> Attendees who can no longer attend may release their slot via the in-app portal. Released seats are immediately offered to the #1 candidate on the dynamic waitlist. No refunds or partial credits are issued for drop-outs.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            6. Date Modifications &amp; Rescheduling
          </h2>
          <p>
            Subject to sanctuary availability, dates may be rescheduled if requested at least <strong className="text-white">7 days prior</strong> to the original check-in date. Any difference in seasonal pricing tariffs will be applicable. Rescheduling requests made within 7 days of check-in are treated as cancellations and re-bookings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            7. Force Majeure &amp; Emergency Exceptions
          </h2>
          <p>
            In the rare event of unforeseen natural disasters, government travel prohibitions, or verifiable medical emergencies, exceptions to the standard cancellation policy may be reviewed at the sole discretion of Nothingness management upon submission of relevant supporting documentation.
          </p>
        </section>

        <section className="space-y-3 border-t border-zinc-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight">
            8. Contact for Refund Inquiries
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1 text-xs sm:text-sm font-mono text-zinc-300">
            <p><strong className="text-white">Merchant / Operator:</strong> Sheikh Arsalan Ullah Chishti (Nothingness)</p>
            <p><strong className="text-white">Registered Address:</strong> B-80, Ground Floor, Street 8, Ghaffar Manzil, Jamia Nagar, Okhla, New Delhi - 110025, Delhi, India</p>
            <p><strong className="text-white">Refund Support Email:</strong> <a href="mailto:concierge@nothingness.asia" className="text-accent-gold underline">concierge@nothingness.asia</a></p>
            <p><strong className="text-white">Concierge Helpline:</strong> <a href="tel:+918527976791" className="text-accent-gold underline">+91 85279 76791</a> (09:00 AM – 09:00 PM IST)</p>
          </div>
        </section>
      </article>
    </main>
  );
}
