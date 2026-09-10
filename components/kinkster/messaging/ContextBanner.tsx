'use client';

import React from 'react';
import { Calendar, Users, FileText, Sparkles, User, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export interface ContextBannerProps {
  context?: {
    contextType: 'event' | 'community' | 'post' | 'profile' | 'resonance';
    contextId: string;
    isAvailable: boolean;
    title: string;
    subtitle?: string;
    mediaUrl?: string | null;
    badge?: string;
    metadata?: Record<string, any>;
  } | null;
}

export default function ContextBanner({ context }: ContextBannerProps) {
  if (!context) return null;

  if (!context.isAvailable) {
    return (
      <div className="mx-4 my-2 p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center gap-3 text-zinc-500">
        <AlertCircle className="w-4 h-4 text-zinc-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold font-mono text-zinc-400">{context.title}</p>
          {context.subtitle && (
            <p className="text-[10px] font-mono text-zinc-600 truncate">{context.subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  const getIcon = () => {
    switch (context.contextType) {
      case 'event':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'community':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'post':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'resonance':
        return <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />;
      case 'profile':
      default:
        return <User className="w-4 h-4 text-accent-gold" />;
    }
  };

  const getTargetUrl = () => {
    switch (context.contextType) {
      case 'event':
        return '/kinksters/events';
      case 'community':
        return context.metadata?.slug ? `/kinksters/groups/${context.metadata.slug}` : '/kinksters/groups';
      case 'profile':
        return context.metadata?.alias ? `/kinksters/${context.metadata.alias}` : null;
      default:
        return null;
    }
  };

  const targetUrl = getTargetUrl();

  return (
    <div className="mx-4 my-2 p-3 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-zinc-950 border border-zinc-800 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-accent-gold/90">
                {context.badge || 'Shared Context'}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white truncate font-mono">
              {context.title}
            </h4>
            {context.subtitle && (
              <p className="text-[10px] text-zinc-400 font-mono truncate">
                {context.subtitle}
              </p>
            )}
          </div>
        </div>

        {targetUrl && (
          <Link
            href={targetUrl}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-mono flex items-center gap-1 shrink-0 transition-colors"
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
