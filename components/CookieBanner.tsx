'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem('nothingness_cookie_consent');
    if (!hasConsented) {
      // Small delay so it doesn't pop up instantly on page load
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('nothingness_cookie_consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 md:bottom-8 md:left-8 md:right-auto md:max-w-md z-[100]"
        >
          <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
            <h3 className="font-serif text-lg text-white mb-2">Respecting Your Privacy</h3>
            <p className="text-white/50 text-xs leading-relaxed mb-6">
              We use strictly necessary cookies to ensure the site functions securely. We do not use third-party tracking cookies, because discretion is our core ethos.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={acceptCookies}
                className="bg-accent-gold text-black px-6 py-2.5 rounded-full text-[11px] font-semibold tracking-wider uppercase hover:bg-white transition-colors w-full md:w-auto"
              >
                Understood
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
