import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import NextTopLoader from 'nextjs-toploader';
import PageWrapper from "@/components/PageWrapper";
import CookieBanner from "@/components/CookieBanner";
import { Toaster } from "sonner";
import Script from "next/script";

import MobileBottomNav from "@/components/MobileBottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
  interactiveWidget: 'resizes-content',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia'),
  title: {
    template: '%s | Nothingness',
    default: 'Nothingness | India\'s Premier Alternate Lifestyle & Luxury Sanctuary Brand',
  },
  description: "India's Premier Alternate Lifestyle & Luxury Sanctuary Brand. Ultra-discreet, design-forward private sanctuaries with keyless digital check-in, acoustic privacy, and cinematic stays across Delhi NCR and India.",
  keywords: [
    "luxury hospitality india",
    "alternate lifestyle hotel india",
    "private sanctuary airbnb",
    "cinematic stays delhi",
    "underground culture stay",
    "south delhi secret stay",
    "luxury boutique staycation delhi ncr",
    "keyless private apartment stay",
    "jacuzzi private suite delhi",
    "autonomous hospitality india"
  ],
  alternates: {
    canonical: 'https://nothingness.asia',
    types: {
      'application/rss+xml': 'https://nothingness.asia/feed.xml',
    },
  },
  other: {
    'geo.region': 'IN-DL',
    'geo.placename': 'New Delhi',
    'geo.position': '28.6139;77.2090',
    'ICBM': '28.6139, 77.2090',
  },
  openGraph: {
    title: 'Nothingness | India\'s Premier Alternate Lifestyle & Luxury Sanctuary Brand',
    description: "Ultra-discreet, design-forward private sanctuaries with keyless check-in and acoustic privacy across Delhi NCR.",
    url: 'https://nothingness.asia',
    siteName: 'Nothingness',
    images: [
      {
        url: '/images/IMG_9955.jpg',
        width: 1200,
        height: 630,
        alt: 'Nothingness - A State of Mind',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nothingness | India\'s Premier Alternate Lifestyle & Luxury Sanctuary Brand',
    description: "Ultra-discreet, design-forward private sanctuaries with keyless check-in and acoustic privacy across Delhi NCR.",
    images: ['/images/IMG_9955.jpg'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nothingness',
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-grain selection:bg-accent-gold/20 selection:text-accent-muted pb-16 md:pb-0">
        <NextTopLoader
          color="#D4AF37"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #D4AF37,0 0 5px #D4AF37"
        />
        <Toaster 
          theme="dark" 
          toastOptions={{
            style: {
              background: 'rgba(20, 20, 20, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#F5F5F5',
            },
          }} 
        />
        <SmoothScroll>
          <Header />
          <PageWrapper className="flex-grow">
            {children}
          </PageWrapper>
          <Footer />
          <MobileBottomNav />
        </SmoothScroll>
        <CookieBanner />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <script
          id="global-org-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': 'https://nothingness.asia/#organization',
              name: 'Nothingness',
              legalName: 'Nothingness Inc.',
              url: 'https://nothingness.asia',
              logo: 'https://nothingness.asia/images/logo.png',
              description: "India's Premier Alternate Lifestyle & Luxury Sanctuary Brand. Autonomous private stays with keyless entry across Delhi NCR.",
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'New Delhi',
                addressRegion: 'Delhi NCR',
                addressCountry: 'IN'
              }
            })
          }}
        />
      </body>
    </html>
  );
}
