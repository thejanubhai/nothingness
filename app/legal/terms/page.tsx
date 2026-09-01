import { Metadata } from 'next';
import Link from 'next/link';
import JsonLd, { generateBreadcrumbSchema } from '@/components/JsonLd';
import { ShieldCheck, Building2, MapPin, Mail, Phone, Clock, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service & Guest Agreement | Nothingness',
  description:
    'Official Terms of Service, guest code of conduct, booking policies, and legal compliance regulations for Nothingness private sanctuaries and event venues operated by Sheikh Arsalan Ullah Chishti in New Delhi, India.',
  alternates: {
    canonical: 'https://nothingness.asia/legal/terms',
  },
  openGraph: {
    title: 'Terms of Service | Nothingness',
    description: 'Terms of Service and Guest Agreement for Nothingness properties.',
    url: 'https://nothingness.asia/legal/terms',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function TermsPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Terms of Service', url: '/legal/terms' },
  ];

  return (
    <main className="min-h-screen pt-36 pb-24 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto text-zinc-300">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="terms-breadcrumb-schema" />
      
      {/* Header */}
      <div className="border-b border-zinc-800 pb-8 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-gold/10 border border-accent-gold/20 rounded-full text-[10px] font-mono text-accent-gold mb-4 uppercase tracking-widest">
          <FileText className="w-3 h-3" />
          Legal &amp; Compliance
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-3 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono">
          Last Updated: August 2026 • Effective Immediately
        </p>
      </div>

      {/* Business Entity Notice Box */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 mb-10 text-xs sm:text-sm space-y-3">
        <div className="flex items-center gap-2 text-accent-gold font-bold uppercase tracking-wider text-[11px] font-mono">
          <Building2 className="w-4 h-4" /> Merchant &amp; Business Entity Details
        </div>
        <p className="leading-relaxed text-zinc-300">
          This website (<a href="https://nothingness.asia" className="text-accent-gold underline">https://nothingness.asia</a>) is owned and operated by{' '}
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
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or using our website, booking platform, applications, or visiting any sanctuary property operated by{' '}
            <strong className="text-white">Sheikh Arsalan Ullah Chishti</strong> (trading as <em>Nothingness</em>), you expressly agree to be bound by these Terms of Service, all applicable laws and regulations of India, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site or booking our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            2. Scope of Services &amp; Business Category
          </h2>
          <p>
            Nothingness operates in the business category of <strong className="text-white">Hotels and Events</strong>. We provide bespoke private accommodations, luxury sanctuaries, curated boutique hospitality stays, and private event venue bookings in Delhi NCR and across India.
          </p>
          <p>
            All listings, descriptions, imagery, and amenities published on the website accurately reflect the sanctuary properties available for private reservation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            3. Eligibility &amp; Age Restriction (18+ Mandatory)
          </h2>
          <p>
            Nothingness sanctuary properties and private events are strictly for adults. You must be at least <strong className="text-white">18 years of age</strong> to create an account, make a reservation, or enter any property. By proceeding with a booking, you confirm that you and all accompanying guests are 18 years or older.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            4. Mandatory Identity Verification (Police Compliance)
          </h2>
          <p>
            Per government hospitality guidelines and statutory Police Compliance regulations, <strong className="text-white">all staying guests must submit valid Government ID verification (Aadhaar Card or Passport - Front &amp; Back)</strong> prior to check-in.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li>Accepted Documents: Official <strong>Aadhaar Card</strong> or <strong>Passport</strong> only.</li>
            <li>Rejected Documents: Driving License, Voter ID, and PAN Cards are not accepted per local hospitality compliance rules.</li>
            <li>Digital Verification Pass: Verified credentials remain securely vetted for 180 days across repeat visits.</li>
            <li>Failure to complete ID verification prior to scheduled check-in will result in denial of access without refund.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            5. Tariffs, Pricing &amp; Payment Terms
          </h2>
          <p>
            All booking tariffs and event fees are displayed and processed in <strong className="text-white">Indian Rupees (INR - ₹)</strong> and are inclusive of applicable statutory taxes and luxury sanitization fees unless explicitly specified otherwise.
          </p>
          <p>
            All bookings must be paid in full at the time of reservation. Payments are securely processed through RBI-authorized, PCI-DSS compliant payment aggregators (<strong className="text-white">PayU Payments</strong>). We accept UPI, Net Banking, Credit Cards, and Debit Cards. Nothingness does not store or process raw credit/debit card numbers or CVV on our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            6. Cancellation &amp; Refund Policy Summary
          </h2>
          <p>
            Reservations are governed by our official <Link href="/legal/cancellation" className="text-accent-gold underline">Cancellation &amp; Refund Policy</Link>:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li><strong>14 Days or More Prior to Check-in:</strong> 100% Full Refund.</li>
            <li><strong>7 to 13 Days Prior to Check-in:</strong> 50% Refund.</li>
            <li><strong>Less than 7 Days / No-Show:</strong> Non-refundable due to single-party sanctuary booking allocations.</li>
            <li><strong>Refund Turnaround Time:</strong> Approved refunds are credited back to the original payment source within <strong>5 to 7 business days</strong>.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            7. Service Delivery &amp; Digital Fulfillment
          </h2>
          <p>
            As a hospitality and event provider, no physical goods are shipped. Upon successful payment, an electronic reservation voucher is delivered immediately via Email, SMS, and WhatsApp (within 0–15 minutes). Smart lockbox access PINs and sanctuary directions are delivered to the primary guest on check-in day. Refer to our <Link href="/legal/shipping" className="text-accent-gold underline">Service Delivery Policy</Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            8. House Rules, Discretion &amp; Damages
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
            <li><strong>Discretion:</strong> Sharing exact sanctuary addresses or digital entry passcodes with unregistered non-guests is strictly prohibited.</li>
            <li><strong>Smoking:</strong> Strictly prohibited indoors. Designated outdoor smoking areas may be utilized where available.</li>
            <li><strong>Damages:</strong> Guests are liable for any physical damage to the architecture, art installations, or curated amenities during their stay. Costs will be billed to the primary guest.</li>
            <li><strong>Zero Tolerance:</strong> Illegal substances, unauthorized commercial filming without prior written consent, and disruptive behavior are grounds for immediate stay termination without refund.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            9. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by Indian law, Sheikh Arsalan Ullah Chishti and Nothingness shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the website, stay at the sanctuaries, or participation in curated events.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight border-b border-zinc-800/80 pb-2">
            10. Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms of Service and any contractual relationship arising from the use of Nothingness services shall be governed by and construed in accordance with the <strong className="text-white">laws of India</strong>. The courts located at <strong className="text-white">New Delhi, India</strong> shall have exclusive jurisdiction over all disputes arising under or in connection with these terms.
          </p>
        </section>

        <section className="space-y-3 border-t border-zinc-800 pt-6">
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight">
            11. Grievance Redressal &amp; Contact Details
          </h2>
          <p>
            In accordance with the Information Technology Act 2000 and Consumer Protection (E-Commerce) Rules 2020, the contact details of the Grievance Officer are:
          </p>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1 text-xs sm:text-sm font-mono text-zinc-300">
            <p><strong className="text-white">Grievance Officer:</strong> Sheikh Arsalan Ullah Chishti</p>
            <p><strong className="text-white">Designation:</strong> Founder &amp; Proprietor</p>
            <p><strong className="text-white">Operating Address:</strong> B-80, Ground Floor, Street 8, Ghaffar Manzil, Jamia Nagar, Okhla, New Delhi - 110025, Delhi, India</p>
            <p><strong className="text-white">Email:</strong> <a href="mailto:concierge@nothingness.asia" className="text-accent-gold underline">concierge@nothingness.asia</a></p>
            <p><strong className="text-white">Helpline:</strong> <a href="tel:+918527976791" className="text-accent-gold underline">+91 85279 76791</a> (Mon–Sun, 09:00 AM – 09:00 PM IST)</p>
          </div>
        </section>
      </article>
    </main>
  );
}
