'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Flame, Flag, Heart, MessageSquare, Share2, Bookmark, Users } from 'lucide-react';

export interface Post {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  caption: string;
  likes_count: number;
  comments_count?: number;
  is_liked?: boolean;
  created_at: string;
  group_id?: string | null;
  groups?: {
    id: string;
    name: string;
    slug: string;
    avatar_url?: string | null;
  } | null;
  kinkster_profiles: {
    alias: string;
    avatar_url: string;
  };
}

interface FeedPostCardProps {
  post: Post;
  userAlias: string;
  isLoggedIn: boolean;
  isLiked: boolean;
  isSaved: boolean;
  commentsCount: number;
  doubleTapHeartActive: boolean;
  onMediaTap: (postId: string) => void;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenReflections: (post: Post) => void;
  onSharePost: (post: Post) => void;
  onOpenReport: (post: Post) => void;
  onRequireAuth: (action: string) => void;
  onOpenResonate: (target: { alias: string; avatar?: string }) => void;
}

export default function FeedPostCard({
  post,
  userAlias,
  isLoggedIn,
  isLiked,
  isSaved,
  commentsCount,
  doubleTapHeartActive,
  onMediaTap,
  onToggleLike,
  onToggleSave,
  onOpenReflections,
  onSharePost,
  onOpenReport,
  onRequireAuth,
  onOpenResonate,
}: FeedPostCardProps) {
  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-zinc-800 relative">
      {/* Post Author Bar */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <Link href={`/kinksters/${post.kinkster_profiles?.alias || 'anonymous'}`}>
            <img
              src={
                post.kinkster_profiles?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
              }
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border border-rose-500/40 p-0.5 hover:scale-105 transition-transform"
            />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/kinksters/${post.kinkster_profiles?.alias || 'anonymous'}`}
                className="text-sm font-bold text-white font-mono hover:text-rose-400 transition-colors"
              >
                @{post.kinkster_profiles?.alias || 'anonymous'}
              </Link>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-zinc-500">ID Vetted • Confidential Member</span>
              {post.groups && (
                <Link
                  href={`/kinksters/groups/${post.groups.slug}`}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-purple-300 hover:text-white hover:border-purple-500/40 transition-colors"
                >
                  <Users className="w-2.5 h-2.5 text-purple-400" />
                  <span>{post.groups.name}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                onRequireAuth('resonate with member');
                return;
              }
              onOpenResonate({
                alias: post.kinkster_profiles?.alias || 'anonymous',
                avatar: post.kinkster_profiles?.avatar_url,
              });
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer"
            title="Drop Confidential Desire Resonance"
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>Resonate</span>
          </button>
          <span className="text-[11px] text-zinc-600 font-mono">
            {new Date(post.created_at).toLocaleDateString()}
          </span>
          <button
            type="button"
            onClick={() => onOpenReport(post)}
            className="p-1 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-zinc-900"
            title="Report post"
            aria-label="Report post"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Media Container with Double-Tap Heart Animation & Anti-Leak Watermark */}
      <div
        className="relative aspect-square bg-zinc-900 select-none cursor-pointer overflow-hidden"
        onClick={() => onMediaTap(post.id)}
      >
        {post.media_type === 'image' ? (
          <img
            src={post.media_url}
            alt="Post"
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <video
            src={post.media_url}
            controls
            className="w-full h-full object-cover"
          />
        )}

        {/* Dynamic Anti-Leak Viewer Watermark */}
        <div 
          className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 opacity-25 overflow-hidden mix-blend-screen"
          aria-hidden="true"
        >
          <div className="flex justify-between items-start text-[10px] font-mono font-bold tracking-widest text-white/80 drop-shadow rotate-[-8deg] origin-top-left">
            <span>@{userAlias || 'confidential'} • PROTECTED</span>
            <span>{userAlias ? `@${userAlias}` : 'CONFIDENTIAL'}</span>
          </div>
          <div className="flex justify-center items-center text-xs font-mono font-extrabold tracking-widest text-white/70 rotate-[-25deg]">
            <span>NOTHINGNESS VAULT • @{userAlias || 'confidential'}</span>
          </div>
          <div className="flex justify-between items-end text-[10px] font-mono font-bold tracking-widest text-white/80 drop-shadow rotate-[-8deg] origin-bottom-right">
            <span>@{userAlias || 'confidential'}</span>
            <span>DO NOT REDISTRIBUTE</span>
          </div>
        </div>

        {/* Floating Double Tap Heart Pop */}
        {doubleTapHeartActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-ping">
            <Heart className="w-24 h-24 fill-rose-500 text-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.9)]" />
          </div>
        )}
      </div>

      {/* Interaction Footer */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onToggleLike(post.id)}
              className={`flex items-center gap-1.5 transition-all active:scale-90 cursor-pointer ${
                isLiked ? 'text-rose-500' : 'hover:text-rose-500'
              }`}
              aria-label="Like post"
            >
              <Heart
                className={`w-5 h-5 transition-transform active:scale-125 ${
                  isLiked ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
              <span className="text-xs font-mono font-bold">
                {post.likes_count || 0}
              </span>
            </button>

            <button
              onClick={() => onOpenReflections(post)}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              aria-label="Open reflections"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-mono font-bold">
                {commentsCount}
              </span>
            </button>

            <button
              onClick={() => onSharePost(post)}
              className="hover:text-white transition-colors cursor-pointer active:scale-90"
              aria-label="Share post"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => onToggleSave(post.id)}
            className={`transition-all active:scale-90 cursor-pointer ${
              isSaved ? 'text-amber-400' : 'hover:text-amber-400'
            }`}
            aria-label="Save to vault"
          >
            <Bookmark
              className={`w-5 h-5 ${
                isSaved ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>
        </div>

        {post.caption && (
          <p className="text-xs text-zinc-300 leading-relaxed">
            <span className="font-bold text-white font-mono mr-2">
              @{post.kinkster_profiles?.alias}
            </span>
            {post.caption}
          </p>
        )}

        {/* Reflections Preview Link */}
        {commentsCount > 0 && (
          <button
            onClick={() => onOpenReflections(post)}
            className="text-[11px] text-zinc-500 hover:text-zinc-400 font-mono transition-colors block text-left pt-1 cursor-pointer"
          >
            View all {commentsCount} reflection{commentsCount > 1 ? 's' : ''}...
          </button>
        )}
      </div>
    </div>
  );
}
