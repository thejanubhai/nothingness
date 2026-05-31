import Link from 'next/link';

export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent-gold/20">
          <svg className="w-8 h-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h1 className="font-serif text-4xl mb-4 text-white">Check Your Email</h1>
        <p className="text-white/50 text-sm mb-2 leading-relaxed">
          We've sent you a magic link. Click it to sign in to your Guest Portal.
        </p>
        <p className="text-white/30 text-xs mb-10">
          It may take a minute to arrive. Check your spam folder if you don't see it.
        </p>
        
        <Link 
          href="/auth" 
          className="text-accent-gold/60 hover:text-accent-gold text-xs uppercase tracking-[0.2em] transition-colors"
        >
          ← Back to login
        </Link>
      </div>
    </main>
  );
}
