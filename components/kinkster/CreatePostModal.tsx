'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Link2, 
  RefreshCw, 
  Lock,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { stripClientExif } from '@/lib/media/clientExif';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  initialFile?: File | null;
  userAlias?: string;
  userAvatar?: string;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
  initialFile = null,
  userAlias = '',
  userAvatar = '',
}: CreatePostModalProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [directUrl, setDirectUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('dynamics');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialFile if provided when opening
  useEffect(() => {
    if (initialFile) {
      handleSetFile(initialFile);
    }
  }, [initialFile, isOpen]);

  // Lock body scroll on mobile when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSetFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only photos (JPG, PNG, WEBP, HEIC) are supported.');
      return;
    }

    const maxLimit = 15 * 1024 * 1024; // 15MB
    if (file.size > maxLimit) {
      toast.error('Photo size exceeds 15MB limit. Please choose a smaller photo.');
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setMode('upload');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSetFile(file);
    }
  };

  const handleClose = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setDirectUrl('');
    setCaption('');
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (mode === 'upload' && !selectedFile && !previewUrl) {
      toast.error('Please choose a photo first.');
      fileInputRef.current?.click();
      return;
    }

    if (mode === 'url' && !directUrl.trim()) {
      toast.error('Please enter a valid image URL.');
      return;
    }

    setLoading(true);
    try {
      let finalMediaUrl = '';

      if (mode === 'upload' && selectedFile) {
        setUploadProgressText('Scrubbing GPS & EXIF metadata...');
        const scrubbedFile = await stripClientExif(selectedFile);

        setUploadProgressText('Uploading photo...');
        const formData = new FormData();
        formData.append('file', scrubbedFile);
        formData.append('folder', 'nothingness/kinkster_posts');
        formData.append('entityType', 'post');

        const uploadRes = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || 'Failed to upload photo. Please try again.');
        }

        finalMediaUrl = uploadData.url;
      } else if (mode === 'url') {
        finalMediaUrl = directUrl.trim();
      } else if (previewUrl) {
        finalMediaUrl = previewUrl;
      }

      setUploadProgressText('Publishing post...');

      const finalCaption = selectedTag && !caption.includes(`#${selectedTag}`)
        ? `${caption.trim()} #${selectedTag}`.trim()
        : caption.trim();

      const res = await fetch('/api/kinkster/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'image',
          media_url: finalMediaUrl,
          caption: finalCaption,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish post');
      }

      toast.success('Photo post shared to feed!');
      onPostCreated();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while publishing post.');
    } finally {
      setLoading(false);
      setUploadProgressText('');
    }
  };

  if (!isOpen) return null;

  const currentMediaSrc = mode === 'upload' ? previewUrl : directUrl;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto overscroll-contain animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto max-h-[calc(100vh-2rem)] sm:max-h-[92vh] overflow-y-auto flex flex-col">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-base font-bold text-white tracking-wide">
            New Post
          </h3>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading || (!previewUrl && !directUrl)}
            className="text-xs font-bold font-mono px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 text-white hover:from-rose-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              'Share'
            )}
          </button>
        </div>

        {/* Author Moniker Badge */}
        <div className="flex items-center gap-2.5 mb-4 px-1">
          <img
            src={
              userAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
            }
            alt="Author Avatar"
            className="w-8 h-8 rounded-full object-cover border border-rose-500/40 p-0.5"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white font-mono">
              @{userAlias || 'you'}
            </span>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-rose-400" />
              Private Community Feed
            </span>
          </div>
        </div>

        {/* Hidden Native File Input (Images Only) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/gif,image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Media Section: Image Preview */}
          <div>
            {currentMediaSrc ? (
              <>
                <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 aspect-square max-h-[340px] mx-auto flex items-center justify-center group shadow-inner">
                <img
                  src={currentMediaSrc}
                  alt="Post Preview"
                  className="w-full h-full object-cover"
                />

                {/* Floating Action Pill on Photo */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
                    Photo Post
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="pointer-events-auto px-3 py-1.5 bg-black/80 hover:bg-zinc-900 border border-white/20 hover:border-white/40 text-white text-xs font-mono font-bold rounded-xl backdrop-blur-md cursor-pointer transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5 text-rose-400" />
                    Change Photo
                  </button>
                </div>
              </div>

              {/* Privacy Safeguard Indicator */}
              <div className="mt-2.5 flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>GPS & device metadata auto-scrubbed for confidentiality</span>
              </div>
            </>
            ) : (
              /* No photo selected yet: Tap-to-choose from gallery */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-rose-500/50 bg-zinc-900/40 hover:bg-zinc-900/70 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600/20 via-purple-600/20 to-amber-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">
                    Choose a photo
                  </p>
                  <p className="text-xs text-zinc-400">
                    Tap to open your gallery or camera roll
                  </p>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  JPG, PNG, WEBP, HEIC (up to 15MB)
                </p>
              </div>
            )}
          </div>

          {/* Quick toggle to paste URL if user specifically wants external image link */}
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <button
              type="button"
              onClick={() => {
                const next = mode === 'upload' ? 'url' : 'upload';
                setMode(next);
                if (next === 'upload' && !selectedFile) {
                  fileInputRef.current?.click();
                }
              }}
              className="hover:text-zinc-200 transition-colors flex items-center gap-1.5 font-mono text-[11px] cursor-pointer"
            >
              <Link2 className="w-3 h-3 text-rose-400" />
              {mode === 'upload' ? 'Paste photo URL instead' : 'Switch back to Gallery upload'}
            </button>

            {mode === 'upload' && currentMediaSrc && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl('');
                }}
                className="text-zinc-500 hover:text-rose-400 transition-colors text-[11px] font-mono cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>

          {mode === 'url' && (
            <div className="space-y-2 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-xs font-mono"
              />
            </div>
          )}

          {/* Vibe / Category Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 font-mono">
              Category Tag
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'dynamics', label: 'Art & Dynamics' },
                { id: 'stories', label: 'Stories & Whispers' },
                { id: 'gatherings', label: 'Secret Soirées' },
                { id: 'sensory', label: 'Sensory Soaks' },
              ].map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    selectedTag === tag.id
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 font-mono">
              Caption
            </label>
            <textarea
              rows={3}
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-xs leading-relaxed resize-none"
            />
          </div>

          {/* Bottom Share Post Button */}
          <button
            type="submit"
            disabled={loading || (!currentMediaSrc)}
            className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-purple-600 to-amber-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{uploadProgressText || 'Sharing Post...'}</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Share Post</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}