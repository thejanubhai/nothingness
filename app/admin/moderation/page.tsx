'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Flag, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ExternalLink, 
  RefreshCw,
  AlertTriangle,
  User,
  Clock,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface ModerationReport {
  id: string;
  post_id: string;
  reporter_id: string;
  reporter_alias?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  created_at: string;
  post?: {
    id: string;
    media_url: string;
    caption: string;
    created_at: string;
    kinkster_profiles?: {
      alias: string;
      avatar_url: string;
    };
  } | null;
}

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/moderation');
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports || []);
      } else {
        toast.error(data.error || 'Failed to fetch reports');
      }
    } catch (err: any) {
      toast.error('Network error fetching moderation reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportId: string, postId: string, action: 'dismiss' | 'delete_post') => {
    if (action === 'delete_post' && !confirm('Are you sure you want to permanently delete this post and media?')) {
      return;
    }

    setProcessingId(reportId);
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, post_id: postId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      toast.success(action === 'delete_post' ? 'Post deleted and report resolved' : 'Report dismissed');
      
      // Update state locally
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: action === 'delete_post' ? 'resolved' : 'dismissed' }
            : r
        )
      );
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl md:text-4xl text-white">Content Moderation</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-white/50 text-sm tracking-wide mt-1">
            Review member-reported posts, non-consensual leaks, and safety flags.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="self-start sm:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: `All Reports (${reports.length})` },
          { id: 'pending', label: `Pending (${pendingCount})` },
          { id: 'resolved', label: `Resolved (${reports.filter((r) => r.status === 'resolved').length})` },
          { id: 'dismissed', label: `Dismissed (${reports.filter((r) => r.status === 'dismissed').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === tab.id
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold'
                : 'bg-white/[0.02] border border-white/5 text-white/50 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-24 text-center text-xs font-mono text-white/40 animate-pulse">
          Loading safety reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">All Clear</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            {filterStatus === 'all'
              ? 'Zero content reports received. Community guidelines are intact.'
              : `No reports in "${filterStatus}" status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isProcessing = processingId === report.id;
            return (
              <div
                key={report.id}
                className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400">
                      <Flag className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-sm font-bold text-white">{report.reason}</span>
                      <div className="flex items-center gap-2 text-[11px] text-white/40 font-mono mt-0.5">
                        <span>Reported by: @{report.reporter_alias || 'confidential'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(report.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${
                      report.status === 'pending'
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse'
                        : report.status === 'resolved'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>

                {/* Details Note */}
                {report.details && (
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white/70 leading-relaxed font-mono">
                    <span className="text-white/40 uppercase text-[10px] block mb-1">Reporter Notes:</span>
                    "{report.details}"
                  </div>
                )}

                {/* Reported Post Preview Card */}
                {report.post ? (
                  <div className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-black/40 border border-white/5 rounded-xl">
                    <div className="relative w-28 h-28 shrink-0 bg-zinc-900 rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={report.post.media_url}
                        alt="Flagged Media"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-rose-400">
                          @{report.post.kinkster_profiles?.alias || 'anonymous_author'}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">
                          Posted {new Date(report.post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-white/80 line-clamp-3 leading-relaxed">
                        {report.post.caption || 'No caption provided on post.'}
                      </p>
                      <a
                        href={report.post.media_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-accent-gold hover:underline font-mono pt-1"
                      >
                        <span>Open Raw Media</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-xs text-zinc-500 font-mono">
                    Post has already been deleted or removed from database.
                  </div>
                )}

                {/* Admin Actions */}
                {report.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(report.id, report.post_id, 'dismiss')}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
                    >
                      Dismiss Report
                    </button>

                    {report.post && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAction(report.id, report.post_id, 'delete_post')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-mono transition-colors shadow-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Post &amp; Resolve</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
