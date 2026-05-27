export const metadata = {
  title: "Guest Rules & Liability Waiver | Nothingness",
};

export default function LiabilityPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 md:px-12 max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl md:text-5xl text-white mb-8">Guest Rules & Liability Waiver</h1>
      <p className="text-foreground/60 text-sm mb-12">Last Updated: May 2026</p>
      
      <div className="prose prose-invert prose-p:text-foreground/80 prose-headings:font-serif prose-headings:font-normal prose-a:text-accent-gold max-w-none">
        <p>To maintain the sanctity, safety, and exclusivity of the Nothingness community, all guests must strictly adhere to the following rules. By confirming a booking, you acknowledge and accept these terms in their entirety.</p>
        
        <h2>1. Strict Privacy & Non-Disclosure</h2>
        <p>Nothingness is built on absolute discretion. Guests are strictly prohibited from publishing the exact address or exterior photos of the property on social media or any public forum. Interior photography for personal use is permitted, provided it does not compromise the brand's identity or the privacy of future guests.</p>
        
        <h2>2. Assumption of Risk</h2>
        <p>Our properties are experiential and feature specialized, thematic furniture and equipment. By utilizing the property and its amenities, you acknowledge that you do so entirely at your own risk. You agree to use all equipment responsibly and within its intended structural limits.</p>

        <h2>3. Liability Waiver</h2>
        <p>Nothingness, its founders, franchisees, and staff shall not be held liable for any personal injury, emotional distress, physical harm, or property damage sustained during your stay. Guests accept full responsibility for their safety and the safety of their accompanying partner(s).</p>

        <h2>4. Damage Policy</h2>
        <p>Guests are fully responsible for any damages inflicted upon the property, its structural integrity, or specialized equipment during their stay. A security deposit may be held or requested prior to check-in. Any damage exceeding the deposit will be legally pursued for compensation.</p>

        <h2>5. Absolute Zero Tolerance Policies</h2>
        <ul>
          <li><strong>Illegal Activities:</strong> The use or possession of illegal narcotics is strictly banned.</li>
          <li><strong>Consent:</strong> Nothingness advocates for safe, sane, and consensual experiences. Any violation of basic human consent or law on the premises will result in immediate police involvement.</li>
          <li><strong>Parties & Gatherings:</strong> No unauthorized guests. Only the individuals registered via government ID during booking are permitted inside the property.</li>
        </ul>

        <h2>6. Right to Terminate Stay</h2>
        <p>We reserve the right to immediately terminate your stay without a refund if any of the above rules are violated, or if complaints regarding noise or misconduct are received from neighbors.</p>
      </div>
    </main>
  );
}
