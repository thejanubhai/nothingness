import { Metadata } from 'next';
import JsonLd, { generateBreadcrumbSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Accessibility Statement & Digital Compliance | Nothingness',
  description: 'Digital accessibility commitments, WCAG 2.1 Level AA compliance, and physical property accessibility specifications for Nothingness.',
  alternates: {
    canonical: 'https://nothingness.asia/accessibility',
  },
  openGraph: {
    title: 'Accessibility Statement | Nothingness',
    description: 'Digital and physical accessibility standards across Nothingness properties and digital platforms.',
    url: 'https://nothingness.asia/accessibility',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function AccessibilityPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Accessibility', url: '/accessibility' }
  ];

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-4xl mx-auto">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="accessibility-breadcrumb-schema" />
      <div className="prose prose-invert prose-lg max-w-none">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Information</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-8">Accessibility</h1>
        <p className="text-white/60 mb-12">Last Updated: October 2026</p>

        <p>At Nothingness, we are committed to making our website and properties accessible to everyone, including individuals with disabilities. We continually work to improve the user experience for everyone and apply relevant accessibility standards.</p>

        <h2>1. Digital Accessibility</h2>
        <p>We strive to ensure our website conforms to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. This includes:</p>
        <ul>
          <li><strong>Keyboard Navigation:</strong> The site can be navigated using a keyboard.</li>
          <li><strong>Screen Reader Compatibility:</strong> We use ARIA labels to ensure compatibility with screen readers.</li>
          <li><strong>Color Contrast:</strong> Text and background colors have sufficient contrast ratios.</li>
          <li><strong>Motion:</strong> We respect the `prefers-reduced-motion` system setting to disable animations for those who require it.</li>
        </ul>

        <h2>2. Property Accessibility</h2>
        <p>Due to the unique architectural nature and underground/discreet locations of our current properties (like The Chamber), full wheelchair accessibility is currently limited. The Chamber requires navigating a small set of stairs (3 steps) to access the main entrance.</p>
        
        <p>However, we are actively developing our next property with universal design principles in mind to ensure 100% ADA compliance and wheelchair accessibility without compromising the aesthetic and functional requirements of our spaces.</p>

        <h2>3. Feedback</h2>
        <p>We welcome your feedback on the accessibility of Nothingness. If you encounter accessibility barriers, please contact us:</p>

        <hr className="my-12 border-white/10" />
        <p className="text-sm text-white/50">For accessibility inquiries, please contact our team at <a href="mailto:concierge@nothingness.asia">concierge@nothingness.asia</a>.</p>
      </div>
    </main>
  );
}
