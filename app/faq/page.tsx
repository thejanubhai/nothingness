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
    answer: "Keys are placed in a discreet, secret location on the property. Once your online ID verification is complete, you receive the exact location and your designated caretaker's phone number. If you prefer total privacy, check-in and check-out can happen 100% without meeting anyone. If you need assistance finding the property, your caretaker can guide you over the phone or meet you to drop you off. The choice of how you check in is entirely yours."
  },
  {
    question: "What is the Sanctuary Pass and how do private gatherings work?",
    answer: "The Nothingness Sanctuary Pass is a one-time lifetime membership pass for verified guests. It unlocks confidential access to our Secret Gatherings Vault (Tier 1 Salons & Discussions, Tier 2 Noir Masquerades, Tier 3 Intimate Soirées), governed by curated concierge vetting, balanced attendance, and strict camera-free discretion."
  },
  {
    question: "What is the Lifestyle Circle (@kinksters) and why is there an entry barrier?",
    answer: "The Lifestyle Circle is an invite-only private community for verified Nothingness guests. Members connect with complete anonymity under chosen @aliases, share aesthetics, discover mutual sparks without spam, and access secret play suites. A one-time lifetime membership fee filters out casual voyeurs and spam, ensuring an elevated circle where everyone is invested in mutual discretion."
  },
  {
    question: "What are the standard Check-in and Check-out times?",
    answer: "Check-in begins at 1:00 PM onwards. Check-out is strictly at 11:00 AM across all properties to ensure our dedicated turnaround and sanitization team can prepare the sanctuary."
  },
  {
    question: "Can I host a party or bring unregistered visitors?",
    answer: "No. We maintain a strict 'No Unregistered Visitors' policy. Only registered guests whose IDs have been verified prior to check-in are permitted on the property. This is to ensure absolute privacy, safety, and discretion."
  }
];

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Nothingness",
  description: "Common questions regarding private stays, discreet check-in, Police Compliance digital ID verification, acoustic privacy, and guest discretion at Nothingness.",
  keywords: [
    "nothingness faq",
    "private stay questions delhi",
    "discreet hotel check in india",
    "police guest id verification",
    "alternate lifestyle stay safety"
  ],
  alternates: {
    canonical: 'https://nothingness.asia/faq',
  },
  openGraph: {
    title: "Frequently Asked Questions | Nothingness",
    description: "Learn about safety protocols, discreet check-in, and guest discretion policies.",
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
