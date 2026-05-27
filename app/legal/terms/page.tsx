export const metadata = {
  title: "Terms of Service | Nothingness",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 md:px-12 max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl md:text-5xl text-white mb-8">Terms of Service</h1>
      <p className="text-foreground/60 text-sm mb-12">Last Updated: May 2026</p>
      
      <div className="prose prose-invert prose-p:text-foreground/80 prose-headings:font-serif prose-headings:font-normal prose-a:text-accent-gold max-w-none">
        <p>Welcome to Nothingness ("we", "our", or "us"). By accessing our website, booking our properties, or using our services, you agree to be bound by the following Terms of Service. Please read them carefully.</p>
        
        <h2>1. Eligibility and Verification</h2>
        <p>You must be at least 18 years of age to book a stay with Nothingness. Due to the nature of our properties and in compliance with Indian law, all guests must provide valid, government-issued photo identification (Aadhar Card, Passport, or Voter ID) prior to check-in. Failure to provide valid ID will result in denied entry without a refund.</p>
        
        <h2>2. Booking and Payments</h2>
        <p>All bookings are processed via our secure payment gateway partners. 100% payment is required upfront to confirm a booking. By providing payment information, you represent and warrant that you have the legal right to use the payment method provided.</p>

        <h2>3. Right of Admission</h2>
        <p>Nothingness reserves the right of admission. We maintain the right to refuse service, cancel bookings, or evict guests who violate our house rules, cause disturbances, or pose a threat to the safety and privacy of our staff or community.</p>

        <h2>4. Use of Property</h2>
        <p>Our properties are designed for private, personal use. Commercial photography, videography, or hosting events without prior written consent from Nothingness is strictly prohibited. Guests are expected to treat the property, including all specialized furniture and equipment, with care and respect.</p>

        <h2>5. Limitation of Liability</h2>
        <p>To the maximum extent permitted by Indian law, Nothingness shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of our services or properties.</p>

        <h2>6. Governing Law</h2>
        <p>These Terms shall be governed and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of New Delhi.</p>

        <h2>7. Contact Information</h2>
        <p>For any questions regarding these Terms, please contact us at <strong>legal@nothingness.asia</strong>.</p>
      </div>
    </main>
  );
}
