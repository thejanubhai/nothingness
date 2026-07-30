'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, Video, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) {
      toast.error('Please enter a photo or video URL.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/kinkster/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: mediaType,
          media_url: mediaUrl,
          caption
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish post');

      toast.success('Post published to Kinkster Feed!');
      onPostCreated();
      onClose();
      setMediaUrl('');
      setCaption('');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while posting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Share Kinkster Media</h3>
            <p className="text-xs text-zinc-400">Post photos or videos to the vetted community feed</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMediaType('image')}
              className={`flex-1 py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                mediaType === 'image'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Photo Post
            </button>
            <button
              type="button"
              onClick={() => setMediaType('video')}
              className={`flex-1 py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                mediaType === 'video'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <Video className="w-4 h-4" />
              Video Reel
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Media URL (Image or MP4 Video)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-sm"
              required
            />
          </div>

          {mediaUrl && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
              {mediaType === 'image' ? (
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <video src={mediaUrl} controls className="w-full h-full object-cover" />
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Caption
            </label>
            <textarea
              rows={3}
              placeholder="Write a discreet caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !mediaUrl}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {loading ? 'Publishing...' : 'Publish to Private Feed'}
          </button>
        </form>
      </div>
    </div>
  );
}
