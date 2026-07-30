'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, CheckCircle2, AlertTriangle, Clock, ExternalLink, Database } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface CalendarSource {
  id: string;
  space_id: string;
  platform: string;
  inbound_ical_url: string;
  is_active: boolean;
  last_synced_at: string | null;
  sync_status: 'success' | 'error' | 'pending' | null;
  sync_error: string | null;
  spaces?: {
    title: string;
    slug: string;
  };
}

interface Stats {
  totalSources: number;
  activeSources: number;
  successSources: number;
  errorSources: number;
  totalBlockedDates: number;
  lastCronCheck: string;
}

export default function ICalSyncMonitor({ initialData }: { initialData?: { stats: Stats; sources: CalendarSource[] } }) {
  const [stats, setStats] = useState<Stats | null>(initialData?.stats || null);
  const [sources, setSources] = useState<CalendarSource[]>(initialData?.sources || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchSyncStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/calendar-sync/status');
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setSources(data.sources);
      } else {
        toast.error(data.error || 'Failed to fetch calendar status');
      }
    } catch {
      toast.error('Network error fetching calendar status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      void fetchSyncStatus();
    }
  }, [initialData, fetchSyncStatus]);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    toast.loading('Triggering external calendar synchronization...');
    try {
      const res = await fetch('/api/spaces/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      toast.dismiss();
      if (res.ok && data.success) {
        toast.success(`Sync complete! Synced ${data.synced || 0} feeds.`);
        await fetchSyncStatus();
      } else {
        toast.error(data.error || 'Calendar sync encountered errors.');
        await fetchSyncStatus();
      }
    } catch {
      toast.dismiss();
      toast.error('Error executing calendar sync');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
        <div>
          <h2 className="text-lg font-serif text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent-gold" />
            iCal Calendar Sync Monitor
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Real-time synchronization status across Airbnb, Vrbo, Booking.com, and Google Calendar feeds.
          </p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={isSyncing || isLoading}
          className="flex items-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-black px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing Feeds...' : 'Sync All Now'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Active Sync Sources</p>
          <p className="text-2xl font-serif text-white flex items-center justify-between">
            {stats?.activeSources ?? 0}
            <span className="text-xs font-sans text-white/40">/ {stats?.totalSources ?? 0} Total</span>
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Healthy Feeds</p>
          <p className="text-2xl font-serif text-green-400 flex items-center gap-2">
            {stats?.successSources ?? 0}
            <CheckCircle2 className="w-4 h-4 text-green-400/60" />
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Sync Errors</p>
          <p className={`text-2xl font-serif flex items-center gap-2 ${(stats?.errorSources ?? 0) > 0 ? 'text-red-400' : 'text-white/60'}`}>
            {stats?.errorSources ?? 0}
            {(stats?.errorSources ?? 0) > 0 && <AlertTriangle className="w-4 h-4 text-red-400" />}
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Synced Blocked Dates</p>
          <p className="text-2xl font-serif text-accent-gold flex items-center justify-between">
            {stats?.totalBlockedDates ?? 0}
            <Database className="w-4 h-4 text-accent-gold/40" />
          </p>
        </div>
      </div>

      {/* Sources List Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Connected Sync Sources</h3>
          <button 
            onClick={() => void fetchSyncStatus()} 
            className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 uppercase tracking-wider transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Status
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.01] border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-6 py-4 font-medium">Sanctuary / Space</th>
                <th className="px-6 py-4 font-medium">Platform</th>
                <th className="px-6 py-4 font-medium">Sync Status</th>
                <th className="px-6 py-4 font-medium">Last Synced</th>
                <th className="px-6 py-4 font-medium">iCal Feed URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sources.map((source) => (
                <tr key={source.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">
                    {source.spaces?.title || `Space ID: ${source.space_id}`}
                  </td>

                  <td className="px-6 py-4">
                    <span className="capitalize px-2.5 py-1 bg-white/5 text-white/80 rounded-md text-xs font-mono border border-white/10">
                      {source.platform}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {source.sync_status === 'success' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                      </span>
                    ) : source.sync_status === 'error' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs" title={source.sync_error || 'Error'}>
                        <AlertTriangle className="w-3.5 h-3.5" /> Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent-gold/10 text-accent-gold border border-accent-gold/20 text-xs">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-xs text-white/50 font-mono">
                    {source.last_synced_at 
                      ? `${formatDistanceToNow(new Date(source.last_synced_at))} ago` 
                      : 'Never'}
                  </td>

                  <td className="px-6 py-4">
                    <a
                      href={source.inbound_ical_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white/40 hover:text-accent-gold text-xs font-mono max-w-[200px] truncate block flex items-center gap-1 transition-colors"
                      title={source.inbound_ical_url}
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      {source.inbound_ical_url}
                    </a>
                  </td>
                </tr>
              ))}

              {sources.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/30 text-xs">
                    No active iCal calendar sync sources configured yet. Add your Airbnb or Booking.com iCal link in Space settings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
