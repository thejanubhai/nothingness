import { Metadata } from 'next';
import Link from 'next/link';
import JsonLd, { generateBreadcrumbSchema } from '@/components/JsonLd';
import { ShieldCheck, Building2, MapPin, Mail, Phone, Lock, EyeOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Protection | Nothingness',
  description:
    'Privacy Policy, data encryption standards, payment security protocols, and Police Compliance statutory guidelines for Nothingness luxury sanctuaries operated by Sheikh Arsalan Ullah Chishti in New Delhi, India.',
  alternates: {
    canonical: 'https://nothingness.asia/legal/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Nothingness',
    description: 'Our uncompromising commitment to personal data security, payment safety, and guest discretion.',
    url: 'https://nothingness.asia/legal/privacy',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function PrivacyPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Privacy Policy', url: '/legal/privacy' },
  ];

  return (
    <main className="min-h-screen pt-36 pb-24 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto text-zinc-300">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="privacy-breadcrumb-schema" />

      {/* Header */}
      <div className="border-b border-zinc-800 pb-8 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-gold/10 border border-accent-gold/20 rounded-full text-[10px] font-mono text-accent-gold mb-4 uppercase tracking-widest">
          <Lock className="w-3 h-3" />
          Data Protection &amp; Confidentiality
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-3 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono">
          Last Updated: August 2026 • Compliant with Digital Personal Data Protection Act (DPDP Act, India)
        </p>
      </div>

      {/* Business Entity Notice Box */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 mb-10 text-xs sm:text-sm space-y-3">
        <div className="flex items-center gap-2 text-accent-gold font-bold uppercase tracking-wider text-[11px] font-mono">
          <Building2 className="w-4 h-4" /> Data Fiduciary &amp; Merchant Identity
        </div>
        <p className="leading-relaxed text-zinc-300">
          This website (<a href="https://nothingness.asia" className="text-accent-gold underline">https://nothingness.asia</a>) is operated by{' '}
          <strong className="text-white">SHEIKH ARSALAN ULLAH CHISHTI</strong>, trading under the brand name{' '}
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
              <a href="mailto:privacy@nothingness.asia" className="hover:text-white transition-colors">privacy@nothingness.asia</a>
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
            1. Introduction &amp; Commitment to Discretion
          </h2>
          <p>
            At Nothingness, confidentiality and privacy are the cornerstones of our boutique hospitality ecosystem. We are committed to protecting the privacy and security of your personal data in accordance with the Information Technology Act 2000, the Digital Personal Data Protection Act 2023 (DPDP Act), and applicable Indian privacy regulations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            2. Personal Information We Collect
          </h2>
          <p>We collect only the minimum necessary information required to facilitate sanctuary reservations, secure payments, and statutory hotel guest reporting:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li><strong>Contact Details:</strong> Full Name, Mobile Phone Number, and Email Address.</li>
            <li><strong>Government Identification:</strong> Front and back photographs of official Aadhaar Card or Passport for mandatory Police Compliance.</li>
            <li><strong>Transactional Data:</strong> Booking dates, selected sanctuary or event, payment transaction IDs, and invoice records.</li>
            <li><strong>Technical Data:</strong> IP address, device identifier, browser type, and authentication logs for Passkey / OTP session security.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            3. Payment Security &amp; Financial Data Protection
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-accent-gold font-mono text-xs uppercase font-bold">
              <ShieldCheck className="w-4 h-4" /> 100% PCI-DSS Compliant Payment Processing
            </div>
            <p className="text-xs sm:text-sm text-zinc-300">
              All online financial transactions on Nothingness are routed through authorized, certified payment aggregators (<strong className="text-white">PayU Payments</strong>) using 256-bit SSL encryption.
            </p>
            <p className="text-xs text-zinc-400">
              <strong className="text-white">Important:</strong> Nothingness does NOT capture, collect, or store any sensitive cardholder data, including Credit/Debit card numbers, expiry dates, or CVV/PIN codes on our databases or servers. All payment authentication is processed directly on the payment aggregator's secure banking gateway.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            4. How We Use Your Information
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li>To process reservations, confirm payments, and dispatch electronic booking vouchers.</li>
            <li>To generate and provide secure lockbox entrance PINs and sanctuary directions.</li>
            <li>To comply with statutory Police Compliance, Form C, and local hospitality security registrations.</li>
            <li>To facilitate passwordless OTP and biometric Passkey authentication.</li>
            <li>To communicate crucial stay updates, emergency alerts, or customer support responses.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            5. Strict Non-Disclosure &amp; Zero Data Selling Policy
          </h2>
          <p>
            Nothingness maintains an absolute <strong className="text-white">Zero Data Selling Policy</strong>. We do NOT sell, rent, trade, or monetize your personal information to any third-party advertisers, marketing agencies, or data brokers under any circumstances.
          </p>
          <p>
            Information is only shared with trusted service infrastructure providers (such as SMS/WebPush notification delivery networks and government law enforcement when explicitly mandated under lawful warrant).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            6. 180-Day Reusable Vetting &amp; Data Retention
          </h2>
          <p>
            In accordance with digital hospitality guidelines, guest ID verification records are maintained securely in encrypted cloud storage for a period of <strong className="text-white">180 days</strong> from verification. This allows returning guests to book without submitting repetitive ID documents. Document images are automatically scheduled for secure permanent deletion upon expiry.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            7. Cookies &amp; Tracking Technologies
          </h2>
          <p>
            We use essential session cookies to maintain your login state and authentication tokens securely. We do not use intrusive cross-site tracking cookies. You may control cookie preferences through your browser settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            8. Your Rights as a Data Principal
          </h2>
          <p>Under Indian DPDP Act provisions, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li>Request a summary of your personal data processed by Nothingness.</li>
            <li>Request correction or updating of inaccurate personal data.</li>
            <li>Request erasure of your personal data (subject to statutory hotel guest register retention mandates).</li>
            <li>Withdraw consent for optional communications at any time.</li>
          </ul>
        </section>

        <section className="space-y-3 border-t border-zinc-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight">
            9. Grievance Redressal &amp; Data Protection Officer
          </h2>
          <p>
            For any queries, concerns, or grievances regarding your privacy or data processing, you may contact our designated Grievance Officer:
          </p>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1 text-xs sm:text-sm font-mono text-zinc-300">
            <p><strong className="text-white">Data Protection / Grievance Officer:</strong> Sheikh Arsalan Ullah Chishti</p>
            <p><strong className="text-white">Designation:</strong> Proprietor &amp; Data Fiduciary</p>
            <p><strong className="text-white">Registered Address:</strong> B-80, Ground Floor, Street 8, Ghaffar Manzil, Jamia Nagar, Okhla, New Delhi - 110025, Delhi, India</p>
            <p><strong className="text-white">Direct Email:</strong> <a href="mailto:privacy@nothingness.asia" className="text-accent-gold underline">privacy@nothingness.asia</a></p>
            <p><strong className="text-white">Customer Support:</strong> <a href="mailto:concierge@nothingness.asia" className="text-accent-gold underline">concierge@nothingness.asia</a></p>
            <p><strong className="text-white">Helpline:</strong> <a href="tel:+918527976791" className="text-accent-gold underline">+91 85279 76791</a></p>
          </div>
        </section>
      </article>
    </main>
  );
}
