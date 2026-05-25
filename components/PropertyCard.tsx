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
        whileHover={{ y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col gap-4"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-border-subtle">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-accent-muted mb-1">{location}</p>
          <div className="flex justify-between items-start mt-2">
            <h3 className="font-serif text-2xl group-hover:text-accent-gold transition-colors">{title}</h3>
            <p className="font-sans text-lg">${price} <span className="text-sm text-foreground/50">/night</span></p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
