import React from 'react';

export default function AdminLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-pulse pb-16">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-white/5 rounded-xl" />
          <div className="h-4 w-96 bg-white/[0.03] rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-white/5 rounded-xl" />
          <div className="h-9 w-36 bg-accent-gold/20 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-zinc-950/60 border border-white/5 p-6 rounded-3xl space-y-3"
          >
            <div className="h-3 w-24 bg-white/5 rounded" />
            <div className="h-8 w-32 bg-white/10 rounded-lg" />
            <div className="h-3 w-40 bg-accent-gold/10 rounded" />
          </div>
        ))}
      </div>

      {/* Movement Banner Skeleton */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-48 bg-white/10 rounded" />
          <div className="h-3 w-20 bg-accent-gold/20 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-24 bg-black/40 border border-white/5 rounded-2xl" />
          <div className="h-24 bg-black/40 border border-white/5 rounded-2xl" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="h-6 w-40 bg-white/10 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-white/[0.02] border border-white/5 rounded-2xl"
              />
            ))}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="h-6 w-36 bg-white/10 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-white/[0.02] border border-white/5 rounded-2xl"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
