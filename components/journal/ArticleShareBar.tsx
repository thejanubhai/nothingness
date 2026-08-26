'use client';

import React, { useState } from 'react';
import { Share2, Check, Copy, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ArticleShareBarProps {
  title: string;
  slug: string;
}

export default function ArticleShareBar({ title, slug }: ArticleShareBarProps) {
  const [copied, setCopied] = useState(false);

  const articleUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/journal/${slug}`
    : `https://nothingness.asia/journal/${slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      toast.success('Discreet link copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`"${title}" - Nothingness Editorial Journal:\n${articleUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`"${title}" via @nothingness_asia`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(articleUrl)}`, '_blank');
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 my-8 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-accent-gold" />
        <span className="text-xs font-mono uppercase tracking-widest text-white/70 font-semibold">
          Share This Piece
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-mono border border-white/10 transition-colors"
          title="Copy Link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-white/60" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          onClick={handleWhatsAppShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-mono border border-green-500/20 transition-colors"
          title="Share on WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={handleTwitterShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-mono border border-white/10 transition-colors"
          title="Share on X"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post</span>
        </button>
      </div>
    </div>
  );
}
