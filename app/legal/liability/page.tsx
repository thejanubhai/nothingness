import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guest Rules & Liability | Nothingness',
  description: 'Important rules and liability waiver for guests of Nothingness.',
};

export default function LiabilityPage() {
  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-4xl mx-auto">
      <div className="prose prose-invert prose-lg max-w-none">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Legal</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-8">Guest Rules & Liability</h1>
        <p className="text-white/60 mb-12">Last Updated: October 2026</p>

        <p>Nothingness properties contain specialized equipment and bespoke furnishings designed for adult use. By booking and entering the premises, you acknowledge and agree to the following rules and liability waivers.</p>

        <h2>1. Strict House Rules</h2>
        <ul>
          <li><strong>No Visitors:</strong> Only registered guests whose IDs have been verified are permitted on the property. No exceptions.</li>
          <li><strong>Discretion:</strong> Do not photograph the exterior of the property or share its exact location publicly on social media.</li>
          <li><strong>Cleanliness:</strong> Excessive mess, body fluids on unprotected furnishings, or damage to equipment will incur a heavy cleaning/replacement fee.</li>
          <li><strong>Noise:</strong> Respect the neighbors. Keep noise to a minimum, especially after 10 PM.</li>
          <li><strong>No Smoking:</strong> Smoking of any kind is strictly prohibited indoors.</li>
        </ul>

        <h2>2. Assumption of Risk</h2>
        <p>Guests acknowledge that the use of any specialized equipment (including but not limited to suspension gear, restraints, swings, and specific furniture) carries inherent risks of physical injury. Guests assume full responsibility for their own safety and the safety of their partner(s). Nothingness is not liable for any injuries, accidents, or psychological distress resulting from the use of the property or its equipment.</p>

        <h2>3. Consent and Legal Compliance</h2>
        <p>All activities taking place within the property must be consensual and comply with the laws of India. Nothingness has a zero-tolerance policy for non-consensual activity or illegal behavior. In the event of an emergency or suspected illegal activity, Nothingness reserves the right to contact local authorities.</p>

        <h2>4. Equipment Misuse</h2>
        <p>Any damage caused by improper use or exceeding weight limits of the equipment will be charged directly to the guest. Use equipment only as intended and always test weight-bearing items before full use.</p>

        <hr className="my-12 border-white/10" />
        <p className="text-sm text-white/50">By proceeding with your booking, you electronically sign and agree to these terms.</p>
      </div>
    </main>
  );
}
