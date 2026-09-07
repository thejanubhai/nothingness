import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DualTrackOnboarding from '@/components/onboarding/DualTrackOnboarding';

export const metadata: Metadata = {
  title: 'Guest Onboarding & Check-In Gateway | Nothingness',
  description:
    'Verify your Airbnb, MakeMyTrip, Agoda, or Booking.com stay reservation, invite co-guests via WhatsApp, or discover the private Kinkster & Events lifestyle network.',
};

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?redirect=/onboarding');
  }

  return (
    <main className="min-h-screen pt-28 sm:pt-32 pb-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto flex flex-col items-center justify-center relative">
      <DualTrackOnboarding
        initialUser={
          user
            ? {
                id: user.id,
                phone: user.phone,
                email: user.email,
              }
            : null
        }
      />
    </main>
  );
}
