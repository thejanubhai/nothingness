export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-4xl mx-auto">
      <div className="mb-16 border-b border-border-subtle pb-10">
        <h1 className="font-serif text-4xl md:text-5xl mb-6">Cancellation Policy</h1>
      </div>
      <article className="prose prose-invert max-w-none prose-lg font-sans font-light leading-relaxed text-foreground/80">
        <p>Due to the exclusive nature of our properties and the high demand for our curated experiences, our cancellation policy is strict.</p>
        <h3 className="text-xl font-serif text-accent-gold mt-10 mb-4">Standard Policy</h3>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>Full refund for cancellations made within 48 hours of booking, if the check-in date is at least 14 days away.</li>
          <li>50% refund for cancellations made at least 7 days before check-in.</li>
          <li>No refunds for cancellations made within 7 days of check-in.</li>
        </ul>
      </article>
    </main>
  );
}
