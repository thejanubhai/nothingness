import { Metadata } from 'next';
import JsonLd, { generateSanctuaryPassSchema, generateBreadcrumbSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Sanctuary Pass & Secret Gatherings in Delhi NCR | Nothingness',
  description: 'Exclusive lifetime pass to confidential discussion salons, midnight noir masquerades, and curated intimate soirées across Delhi NCR. Governed by concierge vetting and strict discretion.',
  keywords: [
    'sanctuary pass nothingness',
    'secret gatherings delhi',
    'noir masquerade delhi ncr',
    'intimate soirees india',
    'consent governed events delhi',
    'vetted lifestyle salon',
    'discreet events pass'
  ],
  alternates: {
    canonical: 'https://nothingness.asia/sanctuary-pass',
  },
  openGraph: {
    title: 'Sanctuary Pass & Secret Gatherings | Nothingness',
    description: 'Exclusive lifetime pass to confidential discussion salons, midnight noir masquerades, and curated intimate soirées across Delhi NCR.',
    url: 'https://nothingness.asia/sanctuary-pass',
    siteName: 'Nothingness',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/images/IMG_1593.jpg',
        width: 1200,
        height: 630,
        alt: 'Nothingness Sanctuary Pass & Secret Gatherings',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sanctuary Pass & Secret Gatherings | Nothingness',
    description: 'Exclusive lifetime pass to confidential discussion salons, midnight noir masquerades, and curated intimate soirées across Delhi NCR.',
    images: ['/images/IMG_1593.jpg'],
  },
};

export default function SanctuaryPassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Sanctuary Pass', url: '/sanctuary-pass' },
  ];

  return (
    <>
      <JsonLd data={generateSanctuaryPassSchema()} id="sanctuary-pass-schema" />
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="sanctuary-pass-breadcrumb-schema" />
      {children}
    </>
  );
}
