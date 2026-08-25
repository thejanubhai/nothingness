'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface PropertyCardProps {
  title: string;
  location: string;
  image: string;
  price: number;
  slug: string;
}

export default function PropertyCard({ title, location, image, price, slug }: PropertyCardProps) {
  return (
    <Link href={`/spaces/${slug}`} className="block group active:scale-[0.98] transition-transform duration-200">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4"
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4] w-full overflow-hidden rounded-2xl bg-white/5 border border-white/5 shadow-xl">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-all duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Price pill that is visible on mobile and animated on desktop hover */}
          <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-black/70 backdrop-blur-xl px-3.5 py-1.5 md:px-4 md:py-2 rounded-full border border-white/15 opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-500 shadow-lg">
            <span className="text-white text-xs md:text-sm font-semibold font-mono">₹{price.toLocaleString('en-IN')}</span>
            <span className="text-white/60 text-[10px] md:text-xs ml-1">/night</span>
          </div>
        </div>

        {/* Details */}
        <div className="px-1 flex justify-between items-end">
          <div>
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-white/40 mb-1">{location}</p>
            <h3 className="font-serif text-xl sm:text-2xl text-white group-hover:text-accent-gold transition-colors duration-300 leading-tight">{title}</h3>
          </div>
          <div className="text-accent-gold text-xs tracking-wider uppercase font-mono flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Explore →
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
