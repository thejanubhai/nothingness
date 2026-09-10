'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  Users, 
  Sparkles, 
  PlusCircle, 
  ChevronRight, 
  Lock, 
  ShieldCheck, 
  Building2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import CreatePostModal from '@/components/kinkster/CreatePostModal';

interface CreationActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userAlias?: string;
  userAvatar?: string;
  isActivated?: boolean;
}

export default function CreationActionSheet({
  isOpen,
  onClose,
  userAlias = '',
  userAvatar = '',
  isActivated = true,
}: CreationActionSheetProps) {
  const router = useRouter();
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [selectedInitialFile, setSelectedInitialFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  if (!isOpen && !showCreatePostModal) return null;

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedInitialFile(file);
      setShowCreatePostModal(true);
      onClose();
    }
    e.target.value = '';
  };

  const handleOpenComposer = () => {
    setSelectedInitialFile(null);
    setShowCreatePostModal(true);
    onClose();
  };

  const handleCreateGroup = () => {
    onClose();
    router.push('/kinksters/groups?create=true');
  };

  const handleProposeEvent = () => {
    onClose();
    router.push('/kinksters/events?action=host');
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/heic,image/gif,image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-full sm:max-w-md bg-zinc-950 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            >
              {/* Sheet Drag Indicator */}
              <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-4 sm:hidden" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white font-mono">
                      Sanctuary Creation
                    </h2>
                    <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3 text-rose-400" /> Vetted Member Contributions
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="py-4 space-y-2.5">
                {/* 1. Share Photo Reflection */}
                <button
                  type="button"
                  onClick={handlePhotoUpload}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/30 to-zinc-900 hover:from-rose-950/50 hover:to-zinc-850 border border-rose-500/30 transition-all flex items-center justify-between text-left group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white font-mono block">
                        Upload Photo Reflection
                      </span>
                      <span className="text-[11px] text-zinc-400 block leading-tight">
                        Exif-stripped media, dark aesthetics, dynamic tags
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 2. Direct Text/Story Composer */}
                <button
                  type="button"
                  onClick={handleOpenComposer}
                  className="w-full p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 transition-all flex items-center justify-between text-left group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 text-purple-300 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white font-mono block">
                        Media URL / Studio Link
                      </span>
                      <span className="text-[11px] text-zinc-400 block leading-tight">
                        Post Cloudinary / hosted image reflections
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 3. Create Community Group */}
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  className="w-full p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 transition-all flex items-center justify-between text-left group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 text-amber-300 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white font-mono block">
                        Form a Community Group
                      </span>
                      <span className="text-[11px] text-zinc-400 block leading-tight">
                        Launch a private salon, shibari circle, or municipal collective
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 4. Propose Gathering */}
                <button
                  type="button"
                  onClick={handleProposeEvent}
                  className="w-full p-3.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 transition-all flex items-center justify-between text-left group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 text-rose-300 border border-rose-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white font-mono block">
                        Propose Sanctuary Gathering
                      </span>
                      <span className="text-[11px] text-zinc-400 block leading-tight">
                        Host a confidential munch or salon for vetted members
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Embedded Create Post Modal */}
      {showCreatePostModal && (
        <CreatePostModal
          isOpen={showCreatePostModal}
          onClose={() => setShowCreatePostModal(false)}
          onPostCreated={() => {
            setShowCreatePostModal(false);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('post-created'));
            }
          }}
          initialFile={selectedInitialFile}
          userAlias={userAlias}
          userAvatar={userAvatar}
        />
      )}
    </>
  );
}
