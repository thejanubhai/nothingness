import { Metadata } from 'next';
import Link from 'next/link';
import JsonLd, { generateBreadcrumbSchema } from '@/components/JsonLd';
import { Send, Building2, MapPin, Mail, Phone, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping & Service Delivery Policy | Nothingness',
  description:
    'Official Service Delivery & Electronic Fulfillment Policy for Nothingness luxury sanctuary and event reservations operated by Sheikh Arsalan Ullah Chishti in New Delhi, India.',
  alternates: {
    canonical: 'https://nothingness.asia/legal/shipping',
  },
  openGraph: {
    title: 'Shipping & Service Delivery Policy | Nothingness',
    description: 'Instant digital delivery and check-in fulfillment policy for Nothingness reservations.',
    url: 'https://nothingness.asia/legal/shipping',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function ShippingPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Service Delivery Policy', url: '/legal/shipping' },
  ];

  return (
    <main className="min-h-screen pt-36 pb-24 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto text-zinc-300">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="shipping-breadcrumb-schema" />

      {/* Header */}
      <div className="border-b border-zinc-800 pb-8 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-gold/10 border border-accent-gold/20 rounded-full text-[10px] font-mono text-accent-gold mb-4 uppercase tracking-widest">
          <Send className="w-3 h-3" />
          Service Fulfillment
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-3 tracking-tight">
          Shipping &amp; Delivery Policy
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono">
          Last Updated: August 2026 • Digital Service Delivery Standards
        </p>
      </div>

      {/* Business Entity Notice Box */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 mb-10 text-xs sm:text-sm space-y-3">
        <div className="flex items-center gap-2 text-accent-gold font-bold uppercase tracking-wider text-[11px] font-mono">
          <Building2 className="w-4 h-4" /> Merchant &amp; Business Entity Details
        </div>
        <p className="leading-relaxed text-zinc-300">
          This Service Delivery Policy applies to all reservations on{' '}
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
            1. Nature of Services (No Physical Shipping)
          </h2>
          <p>
            Nothingness provides <strong className="text-white">Hospitality, Luxury Sanctuary Accommodations, and Private Event Venue Services</strong>. As our offerings are strictly accommodation and venue-based services, <strong className="text-white">no physical goods or merchandise are shipped or dispatched via courier</strong> to the customer's physical address.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            2. Mode of Service Delivery (Instant Digital Fulfillment)
          </h2>
          <p>
            All bookings and purchases on Nothingness are delivered electronically through instant digital channels:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-accent-gold font-mono text-xs uppercase font-bold">
                <CheckCircle2 className="w-4 h-4" /> 1. Booking Voucher Confirmation
              </div>
              <p className="text-xs sm:text-sm text-zinc-300">
                Immediately upon successful payment authorization through the payment gateway, an official electronic booking confirmation voucher containing your unique Booking Reference ID, dates, and stay details is dispatched to your registered <strong className="text-white">Email Address</strong> and <strong className="text-white">Mobile Phone (SMS / Push Alerts)</strong>.
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">⏱️ Delivery Time: Instant (0 to 15 minutes)</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-accent-gold font-mono text-xs uppercase font-bold">
                <ShieldCheck className="w-4 h-4" /> 2. Discreet Check-in &amp; Secret Key Location
              </div>
              <p className="text-xs sm:text-sm text-zinc-300">
                Following mandatory Government ID verification per Police Compliance hospitality guidelines, confidential sanctuary entrance directions, caretaker contact details, and secret physical key location instructions are electronically delivered to the primary guest on check-in day.
              </p>
              <p className="text-[11px] text-zinc-500 font-mono">⏱️ Delivery Time: On or before scheduled check-in day</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            3. Delivery Charges
          </h2>
          <p>
            Digital delivery of booking vouchers, access tokens, and concierge communication is <strong className="text-white">100% Free (₹0.00)</strong>. There are no courier, handling, or postal charges associated with any reservation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            4. Non-Receipt of Confirmation Voucher or Assistance
          </h2>
          <p>
            If you have completed a payment but have not received your digital booking voucher within 15 minutes due to network issues or incorrect email entry:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li>Check your spam / junk / promotional email folders.</li>
            <li>Log into the <Link href="/auth" className="text-accent-gold underline">Nothingness Portal</Link> to view and download your confirmed stay voucher directly.</li>
            <li>Contact our 24/7 concierge helpline immediately at <a href="tel:+918527976791" className="text-accent-gold underline">+91 85279 76791</a> or email <a href="mailto:concierge@nothingness.asia" className="text-accent-gold underline">concierge@nothingness.asia</a>.</li>
          </ul>
        </section>

        <section className="space-y-3 border-t border-zinc-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight">
            5. Support &amp; Merchant Contact
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1 text-xs sm:text-sm font-mono text-zinc-300">
            <p><strong className="text-white">Operating Entity:</strong> Sheikh Arsalan Ullah Chishti (Nothingness)</p>
            <p><strong className="text-white">Business Address:</strong> B-80, Ground Floor, Street 8, Ghaffar Manzil, Jamia Nagar, Okhla, New Delhi - 110025, Delhi, India</p>
            <p><strong className="text-white">Customer Support Email:</strong> <a href="mailto:concierge@nothingness.asia" className="text-accent-gold underline">concierge@nothingness.asia</a></p>
            <p><strong className="text-white">Concierge Helpline:</strong> <a href="tel:+918527976791" className="text-accent-gold underline">+91 85279 76791</a> (24/7 Guest Assistance)</p>
          </div>
        </section>
      </article>
    </main>
  );
}
