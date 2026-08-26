import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modify or Cancel Reservation | Nothingness',
  description: 'Submit a reservation modification or cancellation ticket to the Nothingness concierge team.',
  alternates: {
    canonical: 'https://nothingness.asia/cancel',
  },
};

export default function CancelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
