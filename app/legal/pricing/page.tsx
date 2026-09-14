import { Metadata } from 'next';
import Link from 'next/link';
import JsonLd, { generateBreadcrumbSchema } from '@/components/JsonLd';
import { CreditCard, Building2, MapPin, Mail, Phone, ShieldCheck, CheckCircle2, IndianRupee, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing & Payment Policy | Nothingness',
  description:
    'Official Pricing and Payment Policy, tariffs, statutory taxes, accepted payment methods, and PayU security compliance for Nothingness luxury sanctuaries and event venues operated by Sheikh Arsalan Ullah Chishti in New Delhi, India.',
  alternates: {
    canonical: 'https://nothingness.asia/legal/pricing',
  },
  openGraph: {
    title: 'Pricing & Payment Policy | Nothingness',
    description: 'Transparent tariffs, GST details, accepted payment methods, and payment gateway compliance.',
    url: 'https://nothingness.asia/legal/pricing',
    images: ['/images/IMG_9955.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing & Payment Policy | Nothingness',
    description: 'Transparent tariffs, GST details, accepted payment methods, and payment gateway compliance.',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function PricingPolicyPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Pricing Policy', url: '/legal/pricing' },
  ];

  return (
    <main className="min-h-screen pt-36 pb-24 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto text-zinc-300">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="pricing-breadcrumb-schema" />

      {/* Header */}
      <div className="border-b border-zinc-800 pb-8 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-gold/10 border border-accent-gold/20 rounded-full text-[10px] font-mono text-accent-gold mb-4 uppercase tracking-widest">
          <IndianRupee className="w-3 h-3" />
          Transparent Commercial Terms
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-3 tracking-tight">
          Pricing &amp; Payment Policy
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono">
          Last Updated: August 2026 • 100% Transparent INR Tariffs &amp; RBI Compliance
        </p>
      </div>

      {/* Business Entity Notice Box (Mandatory for Payment Gateways) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 mb-10 text-xs sm:text-sm space-y-3">
        <div className="flex items-center gap-2 text-accent-gold font-bold uppercase tracking-wider text-[11px] font-mono">
          <Building2 className="w-4 h-4" /> Merchant &amp; Operator Details
        </div>
        <p className="leading-relaxed text-zinc-300">
          This Pricing &amp; Payment Policy applies to all reservations and transactions on{' '}
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
        
        {/* Section 1: Currency & Transparent Pricing */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            1. Pricing Transparency &amp; Currency
          </h2>
          <p>
            At Nothingness, we operate with complete financial transparency. All room tariffs, pass fees, and event charges are listed and processed exclusively in <strong className="text-white">Indian Rupees (INR - ₹)</strong>.
          </p>
          <p>
            The price displayed on the booking summary prior to payment is the exact amount charged to your payment instrument. There are <strong className="text-white">zero hidden checkout surcharges, unexpected platform markups, or undisclosed booking fees</strong>.
          </p>
        </section>

        {/* Section 2: Service Tariffs & Rate Cards */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            2. Schedule of Services &amp; Standard Tariffs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
            {/* Sanctuaries */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between text-accent-gold font-mono text-xs font-bold uppercase">
                <span>Sanctuary Accommodations</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-white">₹4,999 to ₹18,999 / night</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Autonomous luxury suites and private sanctuaries across Delhi NCR. Rates depend on architecture tier, square footage, and acoustic isolation specifications.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1 pt-1 list-disc pl-4">
                <li>Includes primary guest allowance (typically 2 guests).</li>
                <li>Additional guest fees: ₹1,500 – ₹3,500 / night per guest where permitted.</li>
                <li>Sanitization &amp; luxury turnover fee clearly specified per property.</li>
              </ul>
            </div>

            {/* Sanctuary Pass */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between text-amber-400 font-mono text-xs font-bold uppercase">
                <span>Sanctuary Lifetime Pass</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-white">₹1,499 (One-Time)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                One-time, non-recurring lifetime access key to curated private society gatherings, salons, masques, and member retreats.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1 pt-1 list-disc pl-4">
                <li>Lifetime validity with zero recurring subscription fees.</li>
                <li>Requires one-time government ID verification.</li>
              </ul>
            </div>

            {/* Event Passes */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between text-rose-400 font-mono text-xs font-bold uppercase">
                <span>Curated Gathering Passes</span>
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-white">₹1,499 to ₹6,999 / ticket</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Per-gathering ticket prices structured transparently by attendee category (Single Female, Couples, Single Male) for dynamic gender-ratio balancing.
              </p>
            </div>

            {/* Guest ID Verification */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between text-emerald-400 font-mono text-xs font-bold uppercase">
                <span>Statutory ID Verification</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-white">₹0 (Complimentary)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mandatory Police Compliance guest ID verification is free for all registered guests. Once verified, credentials remain active for 180 days across repeat visits.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Taxes & GST Inclusions */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            3. Goods &amp; Services Tax (GST) &amp; Invoicing
          </h2>
          <p>
            In compliance with Indian taxation laws and Central Board of Indirect Taxes and Customs (CBIC) regulations:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li>Hospitality accommodations and event venue reservations are subject to statutory Goods and Services Tax (GST) at prevailing rates (12% or 18% as applicable based on room tariff slabs).</li>
            <li>All taxes are itemized clearly on the booking breakdown before payment confirmation.</li>
            <li>Digital tax invoices specifying the merchant name, address, booking dates, and transaction reference are generated automatically upon successful payment.</li>
          </ul>
        </section>

        {/* Section 4: Accepted Payment Methods */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            4. Accepted Payment Methods
          </h2>
          <p>
            To provide seamless and highly secure checkouts, Nothingness supports all authorized digital payment channels:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 not-prose">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center space-y-1">
              <p className="font-mono text-xs font-bold text-white">UPI</p>
              <p className="text-[11px] text-zinc-400">Google Pay, PhonePe, Paytm, BHIM, CRED</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center space-y-1">
              <p className="font-mono text-xs font-bold text-white">Credit Cards</p>
              <p className="text-[11px] text-zinc-400">Visa, MasterCard, RuPay, Diners Club</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center space-y-1">
              <p className="font-mono text-xs font-bold text-white">Debit Cards</p>
              <p className="text-[11px] text-zinc-400">All major Indian public &amp; private banks</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center space-y-1">
              <p className="font-mono text-xs font-bold text-white">Net Banking</p>
              <p className="text-[11px] text-zinc-400">50+ Indian commercial banks</p>
            </div>
          </div>
        </section>

        {/* Section 5: Payment Security & PayU Compliance */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            5. Payment Security &amp; Gateway Compliance
          </h2>
          <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-accent-gold font-mono text-xs uppercase font-bold">
              <ShieldCheck className="w-4 h-4" /> RBI-Authorized &amp; PCI-DSS Level 1 Processing
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              All financial transactions are processed securely through <strong className="text-white">PayU Payments Private Limited</strong>, an RBI-authorized Payment Aggregator compliant with PCI-DSS (Payment Card Industry Data Security Standard) Level 1.
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong className="text-white">Card Data Security:</strong> Nothingness does not collect, log, or store card numbers, CVV codes, or net-banking credentials on our servers. All sensitive inputs are entered directly into PayU&apos;s encrypted payment gateway iframe or banking redirect page protected by 256-bit SSL encryption.
            </p>
          </div>
        </section>

        {/* Section 6: Bank Statement Descriptor */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            6. Bank Statement Billing Descriptor
          </h2>
          <p>
            When you complete a booking on Nothingness, the transaction will appear on your bank statement, credit card bill, or UPI payment history as:
          </p>
          <div className="bg-black/60 border border-accent-gold/30 p-4 rounded-xl text-center font-mono text-sm text-accent-gold font-bold tracking-wider not-prose">
            PAYU*NOTHINGNESS &nbsp;•&nbsp; NOTHINGNESS &nbsp;•&nbsp; NOTHINGNESS ASIA
          </div>
          <p className="text-xs text-zinc-400">
            If you ever see a charge on your card statement and have questions, please reach out directly to our concierge team at <a href="mailto:concierge@nothingness.asia" className="text-accent-gold underline">concierge@nothingness.asia</a> before initiating a bank dispute or chargeback. We resolve all inquiries within 24 hours.
          </p>
        </section>

        {/* Section 7: Cancellations & Refund Recourse */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            7. Cancellation &amp; Refund Terms
          </h2>
          <p>
            All bookings are governed by our official <Link href="/legal/cancellation" className="text-accent-gold underline font-medium">Cancellation &amp; Refund Policy</Link>:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li><strong>14+ Days Notice:</strong> 100% full refund of the stay tariff.</li>
            <li><strong>7 to 13 Days Notice:</strong> 50% refund of the stay tariff.</li>
            <li><strong>&lt; 7 Days Notice:</strong> Non-refundable due to exclusive single-party inventory allocation.</li>
            <li><strong>Refund Timeline:</strong> Approved refunds are credited directly back to the original payment method via PayU within <strong className="text-white">5 to 7 business days</strong>.</li>
          </ul>
        </section>

        {/* Section 8: Support & Merchant Contact */}
        <section className="space-y-3 border-t border-zinc-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight">
            8. Commercial &amp; Billing Inquiries
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1 text-xs sm:text-sm font-mono text-zinc-300">
            <p><strong className="text-white">Operating Entity:</strong> Sheikh Arsalan Ullah Chishti (Nothingness)</p>
            <p><strong className="text-white">Business Category:</strong> Hotels and Events</p>
            <p><strong className="text-white">Registered Office:</strong> B-80, Ground Floor, Street 8, Ghaffar Manzil, Jamia Nagar, Okhla, New Delhi - 110025, Delhi, India</p>
            <p><strong className="text-white">Billing Support Email:</strong> <a href="mailto:concierge@nothingness.asia" className="text-accent-gold underline">concierge@nothingness.asia</a></p>
            <p><strong className="text-white">Helpline:</strong> <a href="tel:+918527976791" className="text-accent-gold underline">+91 85279 76791</a> (Mon–Sun, 09:00 AM – 09:00 PM IST)</p>
          </div>
        </section>

      </article>
    </main>
  );
}
