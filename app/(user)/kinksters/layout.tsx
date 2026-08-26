import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lifestyle Community & Vetted Member Ecosystem | Nothingness',
  description: "Explore India's premier vetted alternate lifestyle sanctuary network. Connect under private @aliases with 100% ID vetting, stay verification, and discreet curated soirées.",
  keywords: [
    'alternate lifestyle community india',
    'vetted lifestyle network',
    'private member sanctuary delhi',
    'discreet lifestyle stays',
    'nothingness lifestyle'
  ],
  alternates: {
    canonical: 'https://nothingness.asia/kinksters',
  },
  openGraph: {
    title: 'Lifestyle Community & Vetted Member Ecosystem | Nothingness',
    description: "India's premier vetted alternate lifestyle sanctuary network.",
    url: 'https://nothingness.asia/kinksters',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function KinkstersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
