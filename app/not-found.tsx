import Link from 'next/link';
import Magnetic from '@/components/Magnetic';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05),transparent_50%)] pointer-events-none" />
      
      <h1 className="font-serif text-[150px] md:text-[200px] leading-none text-white/5 font-bold select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        404
      </h1>
      
      <div className="relative z-10 flex flex-col items-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-6">Lost in the Void</p>
        <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">This space doesn't exist.</h2>
        <p className="text-white/50 max-w-md mb-12">
          The sanctuary you are looking for has been moved or doesn't exist in our current reality.
        </p>
        
        <Magnetic>
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-black rounded-full text-[13px] font-semibold tracking-[0.15em] uppercase hover:bg-accent-gold hover:text-white transition-all duration-300 active:scale-[0.98]"
          >
            Return to Reality
          </Link>
        </Magnetic>
      </div>
    </main>
  );
}
