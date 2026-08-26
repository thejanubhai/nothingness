import { Metadata } from 'next';
import JsonLd, { generateBreadcrumbSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy | Nothingness',
  description: 'Official cancellation guidelines, refund processing timeframes, and reservation modification rules for Nothingness private sanctuaries.',
  alternates: {
    canonical: 'https://nothingness.asia/legal/cancellation',
  },
  openGraph: {
    title: 'Cancellation Policy | Nothingness',
    description: 'Official reservation cancellation and refund policies.',
    url: 'https://nothingness.asia/legal/cancellation',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function CancellationPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Cancellation Policy', url: '/legal/cancellation' }
  ];

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-4xl mx-auto">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="cancellation-breadcrumb-schema" />
      <div className="prose prose-invert prose-lg max-w-none">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Legal</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-8">Cancellation & Refunds</h1>
        <p className="text-white/60 mb-12">Last Updated: October 2026</p>

        <p>Because Nothingness operates exclusive, highly sought-after properties with limited inventory, our cancellation policy is strictly enforced to ensure fairness to all our guests.</p>

        <h2>1. Standard Cancellation Policy</h2>
        <ul>
          <li><strong>Full Refund:</strong> Cancellations made at least 14 days prior to the check-in date will receive a 100% refund of the booking total.</li>
          <li><strong>Partial Refund:</strong> Cancellations made between 7 to 13 days prior to the check-in date will receive a 50% refund.</li>
          <li><strong>No Refund:</strong> Cancellations made less than 7 days before check-in, or no-shows, will not receive a refund.</li>
        </ul>

        <h2>2. Processing Time</h2>
        <p>Approved refunds are processed back to the original method of payment within 5-7 business days, depending on your bank or credit card provider.</p>

        <h2>3. Force Majeure</h2>
        <p>In the event of an unavoidable natural disaster, government-mandated travel restriction, or severe medical emergency, please contact us. Exceptions to the standard policy are made on a case-by-case basis at the sole discretion of Nothingness management.</p>

        <h2>4. Changes to Bookings</h2>
        <p>Date modifications are subject to availability and must be requested at least 7 days before your original check-in date. A modification fee or fare difference may apply.</p>

        <hr className="my-12 border-white/10" />
        <p className="text-sm text-white/50">To initiate a cancellation, please contact <a href="mailto:support@nothingness.asia">support@nothingness.asia</a> with your booking ID.</p>
      </div>
    </main>
  );
}
