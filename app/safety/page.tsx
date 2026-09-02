import { Metadata } from 'next';
import JsonLd, { generateBreadcrumbSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Safety & Sanitation Protocols | Nothingness',
  description: 'Our uncompromising medical-grade protocols for structural safety, hygiene, equipment sanitation, and complete guest privacy.',
  keywords: [
    'hotel sanitation protocols india',
    'hospitality safety standards',
    'discreet stay security delhi',
    'uvc sterilization hotel rooms'
  ],
  alternates: {
    canonical: 'https://nothingness.asia/safety',
  },
  openGraph: {
    title: 'Safety & Sanitation Protocols | Nothingness',
    description: 'Medical-grade sanitation and structural safety protocols for luxury private sanctuaries.',
    url: 'https://nothingness.asia/safety',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function SafetyPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Safety Protocols', url: '/safety' }
  ];

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-4xl mx-auto">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="safety-breadcrumb-schema" />
      <div className="prose prose-invert prose-lg max-w-none">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Protocols</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-8">Safety & Sanitation</h1>
        <p className="text-white/60 mb-12">Uncompromising Hygiene Standards.</p>

        <p>At Nothingness, we understand that our intimate sanctuaries require absolute dedication to cleanliness, structural safety, and privacy. Here is exactly how we prepare and protect our spaces for every single reservation:</p>

        <h2>1. Fresh Linens & Surface Sanitation</h2>
        <p>Before every guest arrival, our team performs a complete turnover of the sanctuary:</p>
        <ul>
          <li><strong>Fresh Chemically Washed Linens:</strong> Bedsheets, duvet covers, and pillow covers are changed fresh for every single booking and professionally, chemically laundered to ensure impeccable hygiene.</li>
          <li><strong>Surface Sanitization:</strong> All furniture, play surfaces, high-touch areas, and bathroom fixtures are thoroughly wiped down and sanitized before your arrival.</li>
          <li><strong>Complete Turnaround Inspection:</strong> Rooms are individually inspected prior to check-in to ensure pristine condition and complete comfort.</li>
        </ul>

        <h2>2. Specialized Fixture Safety (300 kg Load Tested)</h2>
        <p>Your physical safety is non-negotiable:</p>
        <ul>
          <li><strong>300 kg Tested Chains & Wall Anchors:</strong> Wall-mounted chains and anchor points installed in our suites are structurally tested and rated to comfortably bear up to <strong>300 kg load</strong>.</li>
          <li><strong>Visual Inspection:</strong> Chains, anchor links, and hardware are checked after every checkout for wear, tension, and security.</li>
        </ul>

        <h2>3. Confidential Check-In & Privacy</h2>
        <p>We believe in total discretion with zero awkwardness:</p>
        <ul>
          <li><strong>Secret Key Location:</strong> Keys are placed in a discreet, secret location on the property. If you prefer complete privacy, check-in and check-out can happen 100% without meeting anyone, as long as your Govt ID is verified online.</li>
          <li><strong>Caretaker On-Call Assistance:</strong> After booking, you receive the exact location and your caretaker's phone number. If you need assistance finding the property, the caretaker can guide you over the phone or meet you to drop you off. The choice of how you check in is entirely yours.</li>
          <li><strong>Strictly No Cameras:</strong> There are zero cameras inside the suites. Your private time remains completely confidential.</li>
        </ul>

        <hr className="my-12 border-white/10" />
        <p className="text-sm text-white/50">For questions regarding our protocols, please contact our team at <a href="mailto:concierge@nothingness.asia">concierge@nothingness.asia</a>.</p>
      </div>
    </main>
  );
}
