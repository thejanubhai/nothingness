export const metadata = {
  title: "Cancellation & Refund Policy | Nothingness",
};

export default function CancellationPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 md:px-12 max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl md:text-5xl text-white mb-8">Cancellation & Refund Policy</h1>
      <p className="text-foreground/60 text-sm mb-12">Last Updated: May 2026</p>
      
      <div className="prose prose-invert prose-p:text-foreground/80 prose-headings:font-serif prose-headings:font-normal prose-a:text-accent-gold max-w-none">
        <p>Nothingness is a premium, highly sought-after boutique hospitality experience. Due to the exclusivity of our properties and high demand, we enforce a strict cancellation policy to ensure fairness to all our guests and our business operations.</p>
        
        <h2>1. Standard Cancellation Timeline</h2>
        <ul>
          <li><strong>Full Refund:</strong> Cancellations made at least 14 days prior to the check-in date will receive a 100% refund, minus any payment gateway processing fees.</li>
          <li><strong>50% Refund:</strong> Cancellations made between 7 to 13 days prior to the check-in date will receive a 50% refund.</li>
          <li><strong>No Refund:</strong> Cancellations made less than 7 days prior to the check-in date are strictly non-refundable.</li>
        </ul>

        <h2>2. Payment Gateway Fees</h2>
        <p>Refunds are processed back to the original method of payment. Please note that standard payment gateway processing fees (typically 2-3%) are non-refundable as they are charged by the acquiring bank/gateway at the time of the initial transaction.</p>

        <h2>3. No-Shows and Early Departures</h2>
        <p>Guests who fail to arrive for their booking ("no-shows") or choose to depart before their scheduled check-out date will not be eligible for any refund or credit.</p>

        <h2>4. Booking Modifications</h2>
        <p>Date modifications are treated as a cancellation of the original booking and the creation of a new one. Approval of date changes is entirely at the discretion of Nothingness management and is subject to availability and applicable fare differences.</p>

        <h2>5. Host Cancellations</h2>
        <p>In the extremely rare event that Nothingness must cancel your reservation due to unforeseen maintenance, safety issues, or force majeure events, you will be issued a full 100% refund immediately, including any payment gateway fees.</p>

        <h2>6. Processing Time</h2>
        <p>Approved refunds take approximately 5-7 business days to reflect in your bank account, depending on your financial institution and the payment gateway.</p>
      </div>
    </main>
  );
}
