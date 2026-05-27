'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative w-full h-dvh min-h-[600px] overflow-hidden bg-black flex flex-col justify-end items-center pb-40 md:pb-48">
      {/* Background with parallax-like zoom */}
      <motion.div 
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/images/the-chamber/image-1.jpg"
          alt="The Chamber by Nothingness"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>

      {/* Layered gradients for depth */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-transparent to-transparent" />

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.8 }}
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
      >
        {/* Superhost Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2.5 bg-white/8 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10">
            <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 fill-accent-gold shrink-0" aria-hidden="true"><path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.01.415.001.228c0 4.062-2.877 6.478-6.357 6.478-2.224 0-4.556-1.258-6.709-3.386l-.257-.26-.172-.179h-.011l-.176.185c-2.044 2.1-4.268 3.42-6.535 3.615l-.28.019-.28.006C5.377 31 2.5 28.584 2.5 24.522l.005-.469c.026-.928.23-1.768.83-3.244l.216-.524c.966-2.298 5.083-10.87 7.278-14.908l.498-.958C12.537 1.963 13.992 1 16 1zm0 2c-1.239 0-2.053.539-2.987 2.21l-.523 1.008c-1.926 3.776-6.06 12.43-7.031 14.766l-.216.527c-.436 1.08-.578 1.63-.599 2.199l-.001.212c0 2.545 1.583 3.578 3.857 3.578 1.742 0 3.65-1.018 5.76-2.915l.399-.364.556-.51.467-.404.532.551.411.41 1.095 1.066c2.048 1.915 3.994 2.94 5.783 2.94 2.274 0 3.857-1.033 3.857-3.578l-.007-.262c-.035-.55-.16-1.077-.55-1.99l-.208-.475c-.954-2.274-5.088-10.95-7.05-14.81l-.504-.972C18.053 3.539 17.24 3 16 3zm0 9c2.209 0 4 1.791 4 4s-1.791 4-4 4-4-1.791-4-4 1.791-4 4-4zm0 2c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z"></path></svg>
            <span className="text-[11px] font-semibold tracking-[0.2em] text-white/90 uppercase">6× Superhost</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] tracking-tight mb-6"
        >
          Not a stay.
          <br />
          A state of mind.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="font-sans text-[clamp(0.9rem,2vw,1.15rem)] text-white/60 max-w-lg mx-auto tracking-wide leading-relaxed"
        >
          Privacy. Atmosphere. Escape.
        </motion.p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-[1px] h-8 bg-gradient-to-b from-white/0 via-white/40 to-white/0"
        />
      </motion.div>
    </section>
  );
}
