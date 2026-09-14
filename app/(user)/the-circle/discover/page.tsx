'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function DiscoverRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams ? searchParams.toString() : '';
    const destination = query ? `/the-circle/explore?${query}` : '/the-circle/explore';
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
      Transitioning to Explore...
    </div>
  );
}

export default function DiscoverRedirectPage() {
  return (
    <Suspense fallback={null}>
      <DiscoverRedirectContent />
    </Suspense>
  );
}
