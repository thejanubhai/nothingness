import { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import JsonLd, { generateBreadcrumbSchema } from '@/components/JsonLd';
import { MapPin, Mail, Phone, Clock, Building2, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Concierge & Merchant Details | Nothingness',
  description:
    'Official contact information, merchant details, operating address, and concierge support for Nothingness luxury sanctuaries and event venues operated by Sheikh Arsalan Ullah Chishti in New Delhi, India.',
  keywords: [
    'nothingness contact',
    'sheikh arsalan ullah chishti nothingness',
    'nothingness address delhi',
    'private stay concierge delhi',
    'discreet booking assistance',
    'hospitality franchise inquiry delhi',
  ],
  alternates: {
    canonical: 'https://nothingness.asia/contact',
  },
  openGraph: {
    title: 'Contact Concierge | Nothingness',
    description: 'Speak with our concierge team regarding reservations, partnerships, and customer support with absolute discretion.',
    url: 'https://nothingness.asia/contact',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function ContactPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' },
  ];

  return (
    <main className="min-h-screen pt-32 sm:pt-40 pb-24 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto text-zinc-300">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="contact-breadcrumb-schema" />

      {/* Top Banner */}
      <div className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-gold/10 border border-accent-gold/20 rounded-full text-[10px] font-mono text-accent-gold mb-3 uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          Concierge &amp; Merchant Support
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mb-4 leading-[1.1]">
          Speak with the <span className="text-white/50 italic">Concierge</span>.
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl">
          Whether you are inquiring about a private sanctuary reservation, curated events, franchise partnership, or payment verification, our team operates with promptness and absolute discretion.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Info Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Official Merchant Details Box (Mandatory for Payment Gateway) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
              <div className="w-8 h-8 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-accent-gold" />
              </div>
              <div>
                <h2 className="text-base font-serif text-white font-bold">Official Business &amp; Merchant Identity</h2>
                <p className="text-[11px] text-zinc-500 font-mono">Verified Merchant for Hospitality &amp; Event Bookings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm font-mono">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Legal Entity Name</p>
                <p className="text-white font-semibold">SHEIKH ARSALAN ULLAH CHISHTI</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Trade / Brand Name</p>
                <p className="text-accent-gold font-semibold">Nothingness (Nothingness Asia)</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Business Category</p>
                <p className="text-zinc-200">Hotels and Events</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Operational Hours</p>
                <p className="text-zinc-200">Mon–Sun, 09:00 AM – 09:00 PM IST</p>
              </div>
            </div>

            {/* Operating Address */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent-gold" /> Operating &amp; Registered Office Address
              </p>
              <p className="text-xs sm:text-sm text-zinc-300 font-mono leading-relaxed bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                B-80, Ground Floor, Street 8, Ghaffar Manzil, Jamia Nagar, Okhla, New Delhi - 110025, Delhi, India
              </p>
            </div>

            {/* Direct Communication Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href="mailto:concierge@nothingness.asia"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-accent-gold/50 transition-all group"
              >
                <Mail className="w-4 h-4 text-accent-gold group-hover:scale-110 transition-transform shrink-0" />
                <div className="text-left overflow-hidden">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Customer Support</p>
                  <p className="text-xs text-white group-hover:text-accent-gold transition-colors font-mono truncate">concierge@nothingness.asia</p>
                </div>
              </a>

              <a
                href="tel:+918527976791"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-accent-gold/50 transition-all group"
              >
                <Phone className="w-4 h-4 text-accent-gold group-hover:scale-110 transition-transform shrink-0" />
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Helpline &amp; Phone Support</p>
                  <p className="text-xs text-white group-hover:text-accent-gold transition-colors font-mono">+91 85279 76791</p>
                </div>
              </a>
            </div>
          </div>

          {/* Grievance Redressal Card */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-5 text-xs text-zinc-400 space-y-2">
            <div className="flex items-center gap-2 text-white font-mono font-medium text-xs">
              <UserCheck className="w-4 h-4 text-accent-gold" /> Grievance Redressal &amp; Nodal Officer
            </div>
            <p className="leading-relaxed">
              In accordance with Consumer Protection (E-Commerce) Rules 2020:
              <br />
              <strong className="text-zinc-200">Grievance Officer:</strong> Sheikh Arsalan Ullah Chishti •{' '}
              <strong className="text-zinc-200">Email:</strong> <a href="mailto:grievance@nothingness.asia" className="text-accent-gold underline">grievance@nothingness.asia</a> •{' '}
              <strong className="text-zinc-200">Acknowledgment:</strong> Within 48 hours.
            </p>
          </div>

        </div>

        {/* Form Column (5 cols) */}
        <div className="lg:col-span-5">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
