import { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import JsonLd, { generateBreadcrumbSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Contact Concierge | Nothingness Luxury Sanctuaries',
  description: 'Connect with the Nothingness concierge team for private bookings, press inquiries, and partner network opportunities with complete discretion.',
  keywords: [
    'nothingness contact',
    'private stay concierge delhi',
    'discreet booking assistance',
    'hospitality franchise inquiry delhi'
  ],
  alternates: {
    canonical: 'https://nothingness.asia/contact',
  },
  openGraph: {
    title: 'Contact Concierge | Nothingness',
    description: 'Speak with our concierge team regarding reservations and partnerships with absolute discretion.',
    url: 'https://nothingness.asia/contact',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function ContactPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' }
  ];

  return (
    <main className="min-h-screen pt-32 sm:pt-40 pb-24 px-5 sm:px-6 md:px-8 max-w-6xl mx-auto">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="contact-breadcrumb-schema" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
        {/* Info Side */}
        <div>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-3 font-mono">Get in Touch</p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-6 sm:mb-8 leading-[1.1]">
            Speak with the <br /> <span className="text-white/50 italic">Concierge</span>.
          </h1>
          <p className="text-white/60 mb-8 sm:mb-12 text-base sm:text-lg leading-relaxed max-w-md">
            Whether you are inquiring about a future stay, franchise opportunities, or specific property amenities, our team operates with absolute discretion.
          </p>

          <div className="space-y-6 sm:space-y-8 border-t border-white/10 pt-8 sm:pt-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5 font-mono">General Inquiries</p>
              <a href="mailto:concierge@nothingness.asia" className="text-base sm:text-lg text-white hover:text-accent-gold transition-colors break-all">concierge@nothingness.asia</a>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5 font-mono">Franchise &amp; Press</p>
              <a href="mailto:partners@nothingness.asia" className="text-base sm:text-lg text-white hover:text-accent-gold transition-colors break-all">partners@nothingness.asia</a>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5 font-mono">Emergency (Guests Only)</p>
              <p className="text-base sm:text-lg text-white/60">Provided upon check-in</p>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <ContactForm />
      </div>
    </main>
  );
}
