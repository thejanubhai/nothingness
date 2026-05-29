import { motion } from 'framer-motion';

export default function PropertySkeleton() {
  return (
    <div className="group relative block w-full aspect-[4/5] md:aspect-[16/10] overflow-hidden rounded-2xl bg-white/[0.02] border border-white/5">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full"
        animate={{ translateX: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 z-20">
        <div className="flex items-end justify-between">
          <div className="space-y-4 w-2/3">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="h-8 md:h-12 bg-white/10 rounded w-3/4" />
          </div>
          <div className="h-6 bg-white/10 rounded w-1/4 mb-2" />
        </div>
      </div>
    </div>
  );
}
