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
    <Link href={`/properties/${slug}`} className="block group">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-5"
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-white/5">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-all duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Price pill that appears on hover */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
            <span className="text-white text-sm font-medium">₹{price.toLocaleString('en-IN')}</span>
            <span className="text-white/50 text-xs ml-1">/night</span>
          </div>
        </div>

        {/* Details */}
        <div className="px-1">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-2">{location}</p>
          <h3 className="font-serif text-2xl text-white group-hover:text-accent-gold transition-colors duration-300">{title}</h3>
        </div>
      </motion.div>
    </Link>
  );
}
