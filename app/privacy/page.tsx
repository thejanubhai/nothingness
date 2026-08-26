import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Nothingness',
  description: 'Our privacy commitments and data protection policies.',
  alternates: {
    canonical: 'https://nothingness.asia/legal/privacy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-4xl mx-auto">
      <div className="mb-16 border-b border-border-subtle pb-10">
        <h1 className="font-serif text-4xl md:text-5xl mb-6">Privacy Policy</h1>
        <p className="text-foreground/70 font-sans tracking-wide">Last updated: October 2026</p>
      </div>
      <article className="prose prose-invert max-w-none prose-lg font-sans font-light leading-relaxed text-foreground/80">
        <p>At Nothingness, your privacy is treated with the same reverence as our physical spaces. We collect only what is absolutely necessary to facilitate your sanctuary experience.</p>
        <h3 className="text-xl font-serif text-accent-gold mt-10 mb-4">Data Collection</h3>
        <p>We collect your email for passwordless authentication and minimal details required for booking processing.</p>
        <h3 className="text-xl font-serif text-accent-gold mt-10 mb-4">Data Usage</h3>
        <p>Your information is never sold, traded, or used for generic marketing spam. It exists solely to manage your relationship with our properties.</p>
      </article>
    </main>
  );
}
