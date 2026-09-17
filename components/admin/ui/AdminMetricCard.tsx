import React from 'react';
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AdminMetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  highlightColor?: 'gold' | 'emerald' | 'amber' | 'purple' | 'rose';
}

export default function AdminMetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  highlightColor = 'gold',
}: AdminMetricCardProps) {
  const iconColors = {
    gold: 'bg-accent-gold/10 border-accent-gold/25 text-accent-gold',
    emerald: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    purple: 'bg-purple-500/10 border-purple-500/25 text-purple-300',
    rose: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
  }[highlightColor];

  return (
    <div className="bg-zinc-950/60 backdrop-blur-md border border-white/5 hover:border-accent-gold/30 hover:bg-white/[0.02] p-5 sm:p-6 rounded-3xl shadow-lg transition-all group relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono font-medium">
          {label}
        </p>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${iconColors}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <h2 className="font-serif text-3xl sm:text-4xl text-white font-bold tracking-tight">
          {value}
        </h2>
        {trend && (
          <span
            className={`text-[10px] font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
              trend.direction === 'up'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : trend.direction === 'down'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-white/5 text-white/40 border border-white/10'
            }`}
          >
            {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-[10px] text-accent-gold/80 font-mono mt-2 truncate">
          {subtext}
        </p>
      )}

      {/* Subtle bottom border accent glow */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-accent-gold/0 group-hover:via-accent-gold/30 to-transparent transition-all" />
    </div>
  );
}
