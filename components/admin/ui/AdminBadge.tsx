import React from 'react';

export type BadgeStatus =
  | 'confirmed'
  | 'completed'
  | 'checked_in'
  | 'active'
  | 'verified'
  | 'paid'
  | 'resolved'
  | 'pending'
  | 'under_review'
  | 'new'
  | 'draft'
  | 'cancelled'
  | 'failed'
  | 'dismissed'
  | 'inactive'
  | 'gatekeeper'
  | 'vip'
  | 'curated'
  | 'ota'
  | 'direct'
  | string;

interface AdminBadgeProps {
  status: BadgeStatus;
  label?: string;
  size?: 'sm' | 'md';
}

export default function AdminBadge({ status, label, size = 'sm' }: AdminBadgeProps) {
  const norm = (status || '').toLowerCase().replace(/[-_\s]+/g, '_');

  let colorClasses = 'bg-white/5 border-white/10 text-white/50';

  if (
    ['confirmed', 'completed', 'checked_in', 'active', 'verified', 'paid', 'resolved'].includes(
      norm
    )
  ) {
    colorClasses = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
  } else if (['pending', 'under_review', 'new', 'draft', 'awaiting'].includes(norm)) {
    colorClasses = 'bg-amber-500/10 border-amber-500/25 text-amber-300';
  } else if (['cancelled', 'failed', 'dismissed', 'inactive', 'rejected', 'error'].includes(norm)) {
    colorClasses = 'bg-rose-500/10 border-rose-500/25 text-rose-400';
  } else if (['gatekeeper', 'vip', 'curated', 'kinkster'].includes(norm)) {
    colorClasses = 'bg-purple-500/10 border-purple-500/25 text-purple-300';
  } else if (['ota', 'direct', 'sync'].includes(norm)) {
    colorClasses = 'bg-blue-500/10 border-blue-500/25 text-blue-300';
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-[9px] px-2 py-0.5'
      : 'text-[11px] px-2.5 py-1 font-semibold';

  const displayText = label || status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider rounded-md border font-bold ${colorClasses} ${sizeClasses}`}
    >
      <span className="w-1 h-1 rounded-full bg-current opacity-70" />
      {displayText}
    </span>
  );
}
