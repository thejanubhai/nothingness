import { Metadata } from 'next';
import Link from 'next/link';
import FaqAccordion from '@/components/FaqAccordion';
import JsonLd, { generateFaqSchema, generateBreadcrumbSchema } from '@/components/JsonLd';

const faqs = [
  {
    question: "What exactly is Nothingness?",
    answer: "Nothingness is India's premier alternate lifestyle hospitality brand. We provide private, aesthetically curated spaces designed for sensory immersion, intimacy, custom architectural elements, premium textures, and absolute discretion."
  },
  {
    question: "Is my privacy guaranteed?",
    answer: "Absolutely. We understand that discretion is paramount for our guests. Our booking system is secure, properties have nondescript exteriors, and we have a strict policy against photography of the exterior or sharing exact locations publicly."
  },
  {
    question: "Are your properties safe and clean?",
    answer: "Yes. All our specialized fixtures and furnishings are industrial-grade and strictly vetted for structural safety. We also maintain sanitization protocols that exceed industry standards to ensure a completely safe and hygienic environment."
  },
  {
    question: "Do I need to bring my own accessories?",
    answer: "Our properties come equipped with a carefully selected range of high-end ambient fixtures, mood lighting, and curated amenities. However, you are welcome to bring your own personal accessories."
  },
  {
    question: "How does check-in work?",
    answer: "Check-in is 100% autonomous and keyless. Once your digital ID verification is completed per Delhi Police regulations, you receive a dynamic smart lockbox code directly on WhatsApp prior to arrival."
  },
  {
    question: "Can I host a party or bring unregistered visitors?",
    answer: "No. We maintain a strict 'No Unregistered Visitors' policy. Only registered guests whose IDs have been verified prior to check-in are permitted on the property. This is to ensure absolute privacy, safety, and discretion."
  }
];

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Nothingness",
  description: "Common questions regarding private stays, keyless check-in, Delhi Police digital ID compliance, acoustic privacy, and guest discretion at Nothingness.",
  keywords: [
    "nothingness faq",
    "private stay questions delhi",
    "keyless hotel check in india",
    "delhi police guest id verification",
    "alternate lifestyle stay safety"
  ],
  alternates: {
    canonical: 'https://nothingness.asia/faq',
  },
  openGraph: {
    title: "Frequently Asked Questions | Nothingness",
    description: "Learn about safety protocols, keyless check-in, and guest discretion policies.",
    url: "https://nothingness.asia/faq",
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function FAQPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'FAQ', url: '/faq' },
  ];

  return (
    <main className="min-h-screen pt-32 sm:pt-40 pb-24 px-5 sm:px-6 md:px-8 max-w-4xl mx-auto">
      {/* Schema Structured Data */}
      <JsonLd data={generateFaqSchema(faqs)} id="faq-schema" />
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="faq-breadcrumb-schema" />

      <div className="text-center mb-12 sm:mb-20">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-3 font-mono">Information &amp; Policies</p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 text-white">Frequently Asked Questions</h1>
        <p className="text-white/50 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Everything you need to know about your stay, safety protocols, and what to expect when you cross the threshold.
        </p>
      </div>

      <FaqAccordion faqs={faqs} />

      <div className="mt-16 sm:mt-24 text-center space-y-4">
        <p className="text-white/50 text-sm">Still have questions?</p>
        <Link 
          href="/contact" 
          className="inline-block bg-accent-gold hover:bg-white text-black px-8 py-3.5 rounded-full text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 shadow-xl font-mono"
        >
          Contact Concierge
        </Link>
      </div>
    </main>
  );
}
