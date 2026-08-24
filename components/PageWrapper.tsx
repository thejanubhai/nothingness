"use client";

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function PageWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <div className={`flex-grow h-full flex flex-col min-h-0 w-full ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
