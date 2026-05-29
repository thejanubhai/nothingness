import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safety & Sanitation | Nothingness',
  description: 'Our uncompromising protocols for safety, hygiene, and equipment sanitation.',
};

export default function SafetyPage() {
  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-4xl mx-auto">
      <div className="prose prose-invert prose-lg max-w-none">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Protocols</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-8">Safety & Sanitation</h1>
        <p className="text-white/60 mb-12">Uncompromising Hygiene Standards.</p>

        <p>At Nothingness, we understand that the nature of our spaces requires absolute perfection in cleanliness and safety. We go above and beyond standard hospitality practices to ensure an impeccably sterile and secure environment for every guest.</p>

        <h2>1. Medical-Grade Sanitation</h2>
        <p>Between every stay, our properties undergo a rigorous 3-stage cleaning process:</p>
        <ul>
          <li><strong>Surface Sterilization:</strong> All high-touch surfaces, particularly leather, polyurethane, and metal equipment, are sterilized using hospital-grade, non-toxic disinfectants.</li>
          <li><strong>UVC Light Treatment:</strong> We utilize UVC light towers in all rooms to neutralize airborne pathogens and sanitize hard-to-reach areas.</li>
          <li><strong>Linens & Textiles:</strong> All linens, including specialized restraints and straps that are fabric-based, are industrially laundered at high temperatures with antibacterial agents.</li>
        </ul>

        <h2>2. Equipment Safety</h2>
        <p>Your physical safety is our primary concern. All specialized equipment is:</p>
        <ul>
          <li><strong>Industrial Grade:</strong> Hardpoints and suspension rigs are installed by professional structural engineers and rated for 500kg+ loads.</li>
          <li><strong>Routine Inspections:</strong> Equipment is visually and structurally inspected after every single checkout. Leather straps, carabiners, and chains are replaced periodically to prevent wear-and-tear failures.</li>
        </ul>

        <h2>3. Personal Security & Discretion</h2>
        <p>We prioritize your privacy as a matter of security:</p>
        <ul>
          <li><strong>Keyless Entry:</strong> Properties are accessed via unique, time-sensitive digital codes. You will never interact with staff unless requested.</li>
          <li><strong>No Cameras:</strong> There are absolutely no cameras inside the property. We strictly enforce our privacy policies.</li>
          <li><strong>Emergency Support:</strong> An emergency contact number is provided upon check-in for immediate, discreet assistance 24/7.</li>
        </ul>

        <hr className="my-12 border-white/10" />
        <p className="text-sm text-white/50">For questions regarding our protocols, please contact our team at <a href="mailto:concierge@nothingness.asia">concierge@nothingness.asia</a>.</p>
      </div>
    </main>
  );
}
