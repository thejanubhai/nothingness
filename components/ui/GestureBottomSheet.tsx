'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

interface GestureBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export default function GestureBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = true,
}: GestureBottomSheetProps) {
  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        triggerHaptic('light');
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // If dragged down past 80px or flicked down with velocity > 250px/s
    if (info.offset.y > 80 || info.velocity.y > 250) {
      triggerHaptic('light');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Draggable Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 320,
              mass: 0.8,
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={`relative w-full max-w-lg bg-zinc-950/95 backdrop-blur-2xl border-t border-x border-zinc-800/80 rounded-t-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.8)] z-10 max-h-[90vh] flex flex-col ${className}`}
          >
            {/* Sheet Drag Pill */}
            <div className="w-full pt-3 pb-2 flex justify-center items-center cursor-grab active:cursor-grabbing touch-none select-none">
              <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 active:bg-amber-400/80 transition-colors" />
            </div>

            {/* Optional Header with Title & Close button */}
            {(title || showCloseButton) && (
              <div className="px-5 py-3 border-b border-zinc-900 flex items-center justify-between shrink-0">
                <div className="text-sm font-semibold text-white tracking-wide">
                  {title}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onClose();
                    }}
                    className="p-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close sheet"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Sheet Scrollable Content */}
            <div className="overflow-y-auto px-5 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex-1 text-zinc-200">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
