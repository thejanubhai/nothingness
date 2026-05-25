export default function TermsPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-4xl mx-auto">
      <div className="mb-16 border-b border-border-subtle pb-10">
        <h1 className="font-serif text-4xl md:text-5xl mb-6">Terms of Secrecy</h1>
        <p className="text-foreground/70 font-sans tracking-wide">Last updated: October 2026</p>
      </div>
      <article className="prose prose-invert max-w-none prose-lg font-sans font-light leading-relaxed text-foreground/80">
        <p>By entering a Nothingness property, you agree to respect the space, the art, and the atmosphere. These are not party houses; they are sanctuaries.</p>
        <h3 className="text-xl font-serif text-accent-gold mt-10 mb-4">Respect for the Space</h3>
        <p>Guests are expected to treat the architecture and curated items with care. Any damage to the property will be billed to the guest.</p>
        <h3 className="text-xl font-serif text-accent-gold mt-10 mb-4">Access</h3>
        <p>Access codes are strictly for the registered guests. Sharing access is grounds for immediate termination of the stay without refund.</p>
      </article>
    </main>
  );
}
