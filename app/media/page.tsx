import Image from "next/image";
import fs from "fs";
import path from "path";

export const metadata = {
  title: "Media & Press | Nothingness",
  description: "Press coverage and media features for Nothingness - India's First & Only BDSM & Kink Hospitality Brand.",
};

export default function MediaPage() {
  // Read all images from the public/images/media directory
  const mediaDir = path.join(process.cwd(), "public/images/media");
  let images: string[] = [];
  try {
    const files = fs.readdirSync(mediaDir);
    images = files
      .filter((file) => file.match(/\.(png|jpe?g)$/i) && file !== 'media__1779911551607.png') // exclude the logo
      .map((file) => `/images/media/${file}`);
  } catch (e) {
    console.error("Error reading media directory:", e);
  }

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16">
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight mb-4 text-foreground">Press & Media</h1>
        <p className="text-xl text-accent-gold font-serif italic mb-6">India's First & Only BDSM & Kink Hospitality Brand</p>
        <p className="text-foreground/70 max-w-2xl text-lg">
          Nothingness has redefined luxury hospitality by creating private, judgment-free sanctuaries designed for absolute intimacy, exploration, and cinematic stays. Explore our features across social media and digital publications.
        </p>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {images.map((src, index) => (
          <div key={index} className="break-inside-avoid group relative rounded-2xl overflow-hidden border border-border-subtle bg-surface-blur">
            <div className="relative w-full aspect-auto h-auto">
              <Image 
                src={src} 
                alt={`Media feature ${index + 1}`} 
                width={800}
                height={1200}
                className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-in-out" 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
              <span className="text-white font-medium tracking-widest text-sm uppercase px-6 py-2 border border-white/20 rounded-full bg-black/50">
                View Feature
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-24 border-t border-border-subtle pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h3 className="font-serif text-2xl text-white mb-2">Press Inquiries</h3>
          <p className="text-foreground/70">For interviews, press kits, or location scouting.</p>
        </div>
        <a href="mailto:press@nothingness.asia" className="px-8 py-4 bg-white text-black rounded-full font-medium tracking-wide hover:bg-accent-gold hover:text-white transition-colors">
          Contact Press Office
        </a>
      </div>
    </main>
  );
}
