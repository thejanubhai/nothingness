import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Nothingness',
  description: 'Terms of Service and Guest Agreement for Nothingness properties.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-4xl mx-auto">
      <div className="prose prose-invert prose-lg max-w-none">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Legal</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-8">Terms of Service</h1>
        <p className="text-white/60 mb-12">Last Updated: October 2026</p>

        <h2>1. Agreement to Terms</h2>
        <p>By accessing or using the services provided by Nothingness Inc. ("Nothingness", "we", "us", or "our"), including booking a stay at any of our properties, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>

        <h2>2. Age and Identification Requirements</h2>
        <p>Nothingness properties are exclusively for adults. You must be at least 18 years of old to book or stay at our properties. A valid government-issued ID (Aadhar, Passport, or Driver's License) is mandatory for all guests and must be presented prior to check-in. Failure to provide valid ID will result in immediate cancellation without refund.</p>

        <h2>3. Booking and Payments</h2>
        <p>All bookings must be paid in full at the time of reservation. We use secure third-party payment processors (Razorpay/Stripe). By submitting payment information, you authorize us to charge the specified amount for your stay.</p>

        <h2>4. Property Rules & Damages</h2>
        <p>Guests are expected to treat the property with respect. Any damages to the property, furnishings, or specialized equipment will be charged to the payment method on file. specialized equipment must be used safely and at the guest's own risk.</p>
        <ul>
          <li>No smoking indoors.</li>
          <li>No unauthorized guests.</li>
          <li>No illegal activities or substances.</li>
          <li>Commercial photography or filming requires prior written consent.</li>
        </ul>

        <h2>5. Privacy & Discretion</h2>
        <p>We take your privacy seriously. However, guests are also expected to maintain the discretion of the property location. Sharing exact addresses or access codes with non-guests is strictly prohibited.</p>

        <h2>6. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Nothingness shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the services.</p>

        <h2>7. Governing Law</h2>
        <p>These terms shall be governed by and construed in accordance with the laws of India, specifically the jurisdiction of New Delhi, without regard to its conflict of law provisions.</p>

        <hr className="my-12 border-white/10" />
        <p className="text-sm text-white/50">For questions about these terms, please contact us at <a href="mailto:legal@nothingness.asia">legal@nothingness.asia</a>.</p>
      </div>
    </main>
  );
}
