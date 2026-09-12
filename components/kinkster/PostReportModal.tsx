'use client';

import React from 'react';
import { Flag, X, RefreshCw } from 'lucide-react';
import { Post } from './FeedPostCard';

interface PostReportModalProps {
  isOpen: boolean;
  post: Post | null;
  reason: string;
  details: string;
  submitting: boolean;
  onReasonChange: (val: string) => void;
  onDetailsChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function PostReportModal({
  isOpen,
  post,
  reason,
  details,
  submitting,
  onReasonChange,
  onDetailsChange,
  onSubmit,
  onClose,
}: PostReportModalProps) {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Flag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Report Content</h3>
          </div>
          <p className="text-xs text-zinc-400">
            Reporting post by{' '}
            <span className="font-mono text-rose-400 font-bold">
              @{post.kinkster_profiles?.alias || 'anonymous'}
            </span>
            . Reports are 100% confidential.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono font-semibold text-zinc-300">
              Reason for report:
            </label>
            <div className="space-y-2">
              {[
                { id: 'non_consensual', label: 'Non-consensual media / identity leak' },
                { id: 'underage', label: 'Underage or identity authenticity concern' },
                { id: 'harassment', label: 'Harassment, coercion or threat' },
                { id: 'spam', label: 'Commercial spam or solicitations' },
                { id: 'guidelines', label: 'Other sanctuary guideline breach' },
              ].map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    reason === r.id
                      ? 'bg-rose-500/10 border-rose-500/40 text-white font-medium'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={(e) => onReasonChange(e.target.value)}
                    className="accent-rose-500"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">
              Additional details (optional):
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => onDetailsChange(e.target.value)}
              placeholder="Help our moderation team understand what happened..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit & Hide Post</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
