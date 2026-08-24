import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Nothingness',
  description: 'How we handle and protect your personal information at Nothingness.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-4xl mx-auto">
      <div className="prose prose-invert prose-lg max-w-none">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Legal</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-8">Privacy Policy</h1>
        <p className="text-white/60 mb-12">Last Updated: October 2026</p>

        <p>At Nothingness, discretion and privacy are at the core of our brand ethos. We are committed to protecting your personal information and your right to privacy. This privacy policy explains what information we collect, how we use it, and what rights you have in relation to it.</p>

        <h2>1. Information We Collect</h2>
        <p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, or otherwise contact us.</p>
        <ul>
          <li><strong>Personal details:</strong> Name, phone number, email address, and government-issued ID (collected securely prior to check-in).</li>
          <li><strong>Payment data:</strong> We collect data necessary to process your payment if you make purchases, such as your payment instrument number. All payment data is stored securely by our PCI-DSS Level 1 certified payment gateway (Cashfree Payments).</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use personal information collected via our website for a variety of business purposes described below:</p>
        <ul>
          <li>To facilitate account creation, OTP verification, and biometric Passkey authentication.</li>
          <li>To fulfill and manage your bookings, payments, and returns.</li>
          <li>To comply with statutory Delhi Police Form C and local hospitality security registrations.</li>
          <li>To enforce our terms, conditions, and policies for business purposes, legal reasons, and contractual obligations.</li>
          <li>To respond to legal requests and prevent harm.</li>
        </ul>

        <h2>3. Will Your Information Be Shared?</h2>
        <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We absolutely DO NOT sell your data to third parties.</p>

        <h2>4. How Long Do We Keep Your Information?</h2>
        <p>We keep your information for as long as necessary to fulfill the purposes outlined in this privacy policy. In accordance with digital hospitality guidelines, guest ID vetting records are maintained for 180 days across bookings to allow reusable access, after which document images are automatically purged from our servers.</p>

        <h2>5. Security of Your Information</h2>
        <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.</p>

        <hr className="my-12 border-white/10" />
        <p className="text-sm text-white/50">For questions about privacy, please contact our Data Protection Officer at <a href="mailto:privacy@nothingness.asia">privacy@nothingness.asia</a>.</p>
      </div>
    </main>
  );
}
