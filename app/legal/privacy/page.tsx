export const metadata = {
  title: "Privacy Policy | Nothingness",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 md:px-12 max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl md:text-5xl text-white mb-8">Privacy Policy</h1>
      <p className="text-foreground/60 text-sm mb-12">Last Updated: May 2026</p>
      
      <div className="prose prose-invert prose-p:text-foreground/80 prose-headings:font-serif prose-headings:font-normal prose-a:text-accent-gold max-w-none">
        <p>At Nothingness, your absolute privacy is our highest priority. This Privacy Policy outlines how we collect, use, protect, and handle your personal information in accordance with the Information Technology Act, 2000 and applicable Indian privacy laws.</p>
        
        <h2>1. Information We Collect</h2>
        <p>We collect information necessary to process your bookings and comply with local hospitality regulations. This includes:</p>
        <ul>
          <li><strong>Personal Data:</strong> Name, email address, phone number.</li>
          <li><strong>Verification Data:</strong> Government-issued ID (Aadhar, Passport) required by law for guest registration.</li>
          <li><strong>Payment Data:</strong> Processed securely by our payment gateway partners; we do not store your full credit card information.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information strictly for the following purposes:</p>
        <ul>
          <li>To process transactions and manage your booking.</li>
          <li>To comply with Indian police verification and guest registry laws.</li>
          <li>To communicate important updates regarding your stay.</li>
        </ul>

        <h2>3. Data Protection and Confidentiality</h2>
        <p>We understand the sensitive nature of our hospitality brand. All personal data and IDs are stored using industry-standard encryption. We operate under a strict non-disclosure ethos. We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties, except where required by law enforcement.</p>

        <h2>4. On-Premise Privacy</h2>
        <p>There are absolutely NO cameras or recording devices inside the private spaces of our properties. Any security cameras are strictly limited to the exterior entryways facing the street/hallway solely for safety verification.</p>

        <h2>5. Your Rights</h2>
        <p>You have the right to request access to the personal data we hold about you and to ask that your personal data be corrected or deleted, subject to our legal obligations to retain guest records under Indian law.</p>

        <h2>6. Contact Us</h2>
        <p>If you have any questions about our privacy practices, please contact our Data Protection Officer at <strong>privacy@nothingness.asia</strong>.</p>
      </div>
    </main>
  );
}
