import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    template: '%s | Nothingness',
    default: 'Nothingness | A State of Mind',
  },
  description: "India's First & Only Kink & BDSM Hospitality Brand. An emotionally immersive, culturally underground, Gen-Z-forward accommodation brand focused on privacy, aesthetics, intimacy, and cinematic stays.",
  keywords: ["luxury hospitality", "kink friendly hotel india", "bdsm friendly airbnb", "cinematic stays", "underground culture", "delhi secret stay"],
  openGraph: {
    title: 'Nothingness | A State of Mind',
    description: "India's First & Only Kink & BDSM Hospitality Brand.",
    url: 'https://nothingness.asia',
    siteName: 'Nothingness',
    images: [
      {
        url: '/images/og-image.jpg',
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
    title: 'Nothingness | A State of Mind',
    description: "India's First & Only Kink & BDSM Hospitality Brand.",
    images: ['/images/og-image.jpg'],
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
      <body className="min-h-full flex flex-col bg-grain selection:bg-accent-gold/20 selection:text-accent-muted">
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
        </SmoothScroll>
        <CookieBanner />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
