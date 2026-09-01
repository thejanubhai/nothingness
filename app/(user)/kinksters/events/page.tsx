'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SanctuaryEventsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sanctuary-pass');
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white pt-32 text-center text-xs font-mono text-zinc-500 animate-pulse">
      Transferring to Sanctuary Pass Portal...
    </div>
  );
}
