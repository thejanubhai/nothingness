import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'gold' | 'emerald' | 'amber' | 'rose' | 'purple';
  actions?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  badge,
  badgeVariant = 'gold',
  actions,
}: AdminPageHeaderProps) {
  const badgeClasses = {
    gold: 'bg-accent-gold/10 border-accent-gold/25 text-accent-gold',
    emerald: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    rose: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
    purple: 'bg-purple-500/10 border-purple-500/25 text-purple-300',
  }[badgeVariant];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white font-bold tracking-tight">
            {title}
          </h1>
          {badge && (
            <span
              className={`text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full border font-bold ${badgeClasses}`}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-white/50 text-xs sm:text-sm tracking-wide mt-1 font-sans max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
