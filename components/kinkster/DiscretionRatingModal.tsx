'use client';

import React, { useState } from 'react';
import { X, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface DiscretionRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAlias: string;
  onRatingSubmitted?: () => void;
}

export default function DiscretionRatingModal({
  isOpen,
  onClose,
  targetAlias,
  onRatingSubmitted
}: DiscretionRatingModalProps) {
  const [discretionScore, setDiscretionScore] = useState<number>(5);
  const [respectScore, setRespectScore] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/kinkster/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_alias: targetAlias,
          discretion_score: discretionScore,
          respect_score: respectScore,
          feedback_text: feedbackText
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rating submission failed');

      toast.success(`Discretion rating submitted for @${targetAlias}!`);
      if (onRatingSubmitted) onRatingSubmitted();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/30 text-rose-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Rate Discretion &amp; Respect</h3>
            <p className="text-xs text-zinc-400">Leave feedback for @{targetAlias}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Discretion Score Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Discretion &amp; Privacy (1-5 Stars)
            </label>
            <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setDiscretionScore(star)}
                  className={`p-1.5 transition-transform hover:scale-125 ${
                    star <= discretionScore ? 'text-amber-400' : 'text-zinc-700'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Respect & Boundaries Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Respect &amp; Boundaries (1-5 Stars)
            </label>
            <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRespectScore(star)}
                  className={`p-1.5 transition-transform hover:scale-125 ${
                    star <= respectScore ? 'text-amber-400' : 'text-zinc-700'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Note */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Private Note (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Private notes are encrypted and only used for community trust scoring..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Submit Discretion Rating'}
          </button>
        </form>
      </div>
    </div>
  );
}
