'use client';

import React from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Post } from './FeedPostCard';

export interface CommentItem {
  id: string;
  alias: string;
  text: string;
  time: string;
}

interface PostCommentDrawerProps {
  isOpen: boolean;
  post: Post | null;
  comments: CommentItem[];
  loading: boolean;
  draft: string;
  isLoggedIn: boolean;
  userAlias: string;
  onDraftChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function PostCommentDrawer({
  isOpen,
  post,
  comments,
  loading,
  draft,
  isLoggedIn,
  userAlias,
  onDraftChange,
  onSubmit,
  onClose,
}: PostCommentDrawerProps) {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full sm:max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white font-mono">Discreet Reflections</h3>
            <span className="text-[10px] font-mono text-zinc-500">
              • @{post.kinkster_profiles?.alias || 'member'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Context Bar */}
        <div className="p-3.5 bg-zinc-900/60 border-b border-zinc-900 flex items-center gap-3">
          <img
            src={
              post.media_type === 'image'
                ? post.media_url
                : post.kinkster_profiles?.avatar_url || '/images/IMG_9955.jpg'
            }
            alt="Post Thumbnail"
            className="w-10 h-10 rounded-lg object-cover border border-zinc-800 shrink-0"
          />
          <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
            <span className="font-bold text-white font-mono mr-1.5">
              @{post.kinkster_profiles?.alias}
            </span>
            {post.caption || 'Shared a discreet lifestyle reflection.'}
          </p>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-zinc-900">
          {loading ? (
            <div className="text-center py-10 text-xs font-mono text-zinc-500 animate-pulse">
              Loading reflections...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-xs font-mono text-zinc-500">
              No reflections yet. Share the first whisper under your @alias.
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-rose-300 font-mono">@{c.alias}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">• {c.time}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form
          onSubmit={onSubmit}
          className="p-3.5 border-t border-zinc-900 bg-zinc-950 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={isLoggedIn ? `Whisper as @${userAlias || 'alias'}...` : 'Sign in to reflect...'}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            disabled={!isLoggedIn}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/60 transition-colors font-mono"
          />
          <button
            type="submit"
            disabled={!draft.trim() || !isLoggedIn}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
