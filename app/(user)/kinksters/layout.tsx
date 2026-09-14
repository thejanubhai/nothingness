import { Metadata } from 'next';
import JsonLd, { generateTheCircleSchema, generateBreadcrumbSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'The Circle | 18+ Private Monikers & Desires | Nothingness',
  description: 'An intimate, confidential society reserved exclusively for verified guests of Nothingness. Connect under complete anonymity with private @aliases, explore deep aesthetic chemistry, and unlock private sanctuary suites.',
  keywords: [
    'the circle nothingness',
    'private moniker network',
    'alternate lifestyle india',
    'vetted adult community delhi',
    'discreet desires social feed',
    'anonymous alias network',
    'sanctuary suites entry barrier'
  ],
  alternates: {
    canonical: 'https://nothingness.asia/kinksters',
  },
  openGraph: {
    title: 'The Circle | 18+ Private Monikers & Desires | Nothingness',
    description: 'An intimate, confidential society reserved exclusively for verified guests of Nothingness. Connect under complete anonymity with private @aliases.',
    url: 'https://nothingness.asia/kinksters',
    siteName: 'Nothingness',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/images/IMG_9955.jpg',
        width: 1200,
        height: 630,
        alt: 'The Circle - Private Monikers & Desires | Nothingness',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Circle | 18+ Private Monikers & Desires | Nothingness',
    description: 'An intimate, confidential society reserved exclusively for verified guests of Nothingness. Connect under complete anonymity with private @aliases.',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function KinkstersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'The Circle', url: '/kinksters' },
  ];

  return (
    <>
      <JsonLd data={generateTheCircleSchema()} id="the-circle-schema" />
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="the-circle-breadcrumb-schema" />
      {children}
    </>
  );
}
