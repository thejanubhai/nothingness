import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

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
  title: "Nothingness | A State of Mind",
  description: "An emotionally immersive, culturally underground, Gen-Z-forward accommodation brand focused on privacy, aesthetics, intimacy, and cinematic stays.",
  keywords: ["luxury hospitality", "art residency", "cinematic stays", "underground culture"],
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
        {children}
      </body>
    </html>
  );
}
