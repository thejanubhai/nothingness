import Image from "next/image";
import Magnetic from "@/components/Magnetic";
import { Metadata } from "next";
import JsonLd, { generateBreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Media, Press & Editorial Features | Nothingness",
  description: "Press coverage and editorial features for Nothingness across Homegrown, ScoopWhoop, and LBB Delhi.",
  keywords: [
    "nothingness media",
    "homegrown nothingness",
    "scoopwhoop alternate lifestyle hotel",
    "lbb delhi secret airbnb",
    "boutique hospitality press india"
  ],
  alternates: {
    canonical: 'https://nothingness.asia/media',
  },
  openGraph: {
    title: "Media & Press | Nothingness",
    description: "Press features and media coverage for India's Premier Alternate Lifestyle & Luxury Sanctuary Brand.",
    url: "https://nothingness.asia/media",
    images: ['/images/IMG_9955.jpg'],
  },
};

const mediaFeatures = [
  {
    publisher: "Homegrown",
    title: "Inside India's First Alternate Lifestyle Hospitality Brand",
    excerpt: "Nothingness is redefining luxury intimacy in New Delhi with its deeply cinematic and meticulously crafted underground stays.",
    image: "/images/media/media_homegrown_1779913186925.png",
    link: "#",
    colSpan: "md:col-span-2 lg:col-span-2"
  },
  {
    publisher: "ScoopWhoop",
    title: "Nothingness Is Redefining Intimacy In India With Cinematic Stays",
    excerpt: "From state-of-the-art sound systems to striking crimson aesthetics, Nothingness offers an unparalleled experiential getaway.",
    image: "/images/media/media_scoopwhoop_1779913223763.png",
    link: "#",
    colSpan: "md:col-span-1 lg:col-span-1"
  },
  {
    publisher: "LBB Delhi",
    title: "This Aesthetic Underground Airbnb Is Delhi's Best Kept Secret",
    excerpt: "A deep dive into the judgment-free sanctuaries created by Nothingness for absolute privacy and exploration.",
    image: "/images/media/media_lbb_1779913209759.png",
    link: "#",
    colSpan: "md:col-span-1 lg:col-span-1"
  },
  {
    publisher: "Instagram @nothingnessog",
    title: "Delhi's Most Exclusive Underground Stay",
    excerpt: "A community-loved sanctuary. Step into an alternate reality curated strictly for the open-minded.",
    image: "/images/media/media_instagram_1779913242079.png",
    link: "https://instagram.com/nothingnessog",
    colSpan: "md:col-span-2 lg:col-span-2"
  }
];

export default function MediaPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Press & Media', url: '/media' }
  ];

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="media-breadcrumb-schema" />
      <div className="mb-16">
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight mb-4 text-foreground">Press & Media</h1>
        <p className="text-xl text-accent-gold font-serif italic mb-6">India's Premier Alternate Lifestyle Hospitality Brand</p>
        <p className="text-foreground/70 max-w-2xl text-lg">
          Nothingness has redefined luxury hospitality by creating private, judgment-free sanctuaries designed for absolute intimacy, exploration, and cinematic stays. Explore our features across social media and digital publications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mediaFeatures.map((feature, index) => (
          <a key={index} href={feature.link} className={`block group rounded-2xl overflow-hidden border border-border-subtle bg-surface-blur flex flex-col ${feature.colSpan} hover:border-accent-gold/40 transition-colors duration-500`}>
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              <Image 
                src={feature.image} 
                alt={feature.title} 
                fill
                className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-in-out" 
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-6 right-6">
                <span className="text-[10px] font-bold tracking-widest text-black uppercase px-3 py-1 bg-accent-gold rounded-full">
                  {feature.publisher}
                </span>
              </div>
            </div>
            
            <div className="p-8 flex-grow flex flex-col justify-between z-10 relative bg-gradient-to-t from-background via-background/90 to-transparent -mt-20">
              <div>
                <h3 className="font-serif text-2xl md:text-3xl text-white mb-4 leading-tight group-hover:text-accent-gold transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-[15px] leading-relaxed">
                  {feature.excerpt}
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-accent-gold text-sm tracking-wider uppercase font-medium group-hover:gap-4 transition-all duration-300">
                <span>Read Full Article</span>
                <span>→</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-24 border-t border-border-subtle pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h3 className="font-serif text-2xl text-white mb-2">Press Inquiries</h3>
          <p className="text-foreground/70">For interviews, press kits, or location scouting.</p>
        </div>
        <Magnetic>
          <a href="mailto:press@nothingness.asia" className="px-8 py-4 bg-white text-black rounded-full font-medium tracking-wide hover:bg-accent-gold hover:text-white transition-colors block text-center">
            Contact Press Office
          </a>
        </Magnetic>
      </div>
    </main>
  );
}
