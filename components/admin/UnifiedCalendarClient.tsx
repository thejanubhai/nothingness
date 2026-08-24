'use client';

import React, { useState, useMemo } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isToday, parseISO, isWithinInterval, startOfDay, endOfDay 
} from 'date-fns';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  RefreshCw, Link2, Copy, Check, Trash2,
  ExternalLink, X, Lock, CheckCircle2, 
  Clock, Radio
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Space {
  id: string;
  title: string;
  slug: string;
  nightly_price: number;
  featured_image?: string;
}

interface Booking {
  id: string;
  space_id: string;
  check_in: string;
  check_out: string;
  status: string;
  payment_status?: string;
  total_price: number;
  guests?: number;
  user_id?: string;
  spaces?: {
    id: string;
    title: string;
    slug: string;
  };
  booking_guests?: Array<{
    name?: string;
    guest_profiles?: {
      full_name?: string;
      phone_number?: string;
      document_number?: string;
    };
  }>;
}

interface BlockedDate {
  id: string;
  space_id: string;
  start_date: string;
  end_date: string;
  summary: string;
  spaces?: {
    id: string;
    title: string;
    slug: string;
  };
}

interface SyncSource {
  id: string;
  space_id: string;
  platform: string;
  inbound_ical_url: string;
  is_active: boolean;
  last_synced_at: string | null;
  sync_status: 'success' | 'error' | 'pending' | null;
  sync_error: string | null;
  spaces?: {
    id: string;
    title: string;
    slug: string;
  };
}

interface Props {
  initialSpaces: Space[];
  initialBookings: Booking[];
  initialBlockedDates: BlockedDate[];
  initialSyncSources: SyncSource[];
}

export default function UnifiedCalendarClient({
  initialSpaces,
  initialBookings,
  initialBlockedDates,
  initialSyncSources
}: Props) {
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(initialBlockedDates);
  const [syncSources, setSyncSources] = useState<SyncSource[]>(initialSyncSources);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'calendar' | 'channels'>('calendar');

  // Modals & Drawers
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState<boolean>(false);
  const [selectedSpaceForChannel, setSelectedSpaceForChannel] = useState<string>(spaces[0]?.id || '');

  // Form State for Block Modal
  const [blockSpaceId, setBlockSpaceId] = useState<string>(spaces[0]?.id || '');
  const [blockStartDate, setBlockStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [blockEndDate, setBlockEndDate] = useState<string>(format(addMonths(new Date(), 0), 'yyyy-MM-dd'));
  const [blockSummary, setBlockSummary] = useState<string>('Maintenance & Deep Cleaning');
  const [blockSubmitting, setBlockSubmitting] = useState<boolean>(false);

  // Form State for Channel Modal
  const [newPlatform, setNewPlatform] = useState<string>('airbnb');
  const [newIcalUrl, setNewIcalUrl] = useState<string>('');
  const [channelSubmitting, setChannelSubmitting] = useState<boolean>(false);

  // Global Syncing State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Filtered Items
  const filteredBookings = useMemo(() => {
    if (selectedSpaceId === 'all') return bookings;
    return bookings.filter(b => b.space_id === selectedSpaceId);
  }, [bookings, selectedSpaceId]);

  const filteredBlockedDates = useMemo(() => {
    if (selectedSpaceId === 'all') return blockedDates;
    return blockedDates.filter(b => b.space_id === selectedSpaceId);
  }, [blockedDates, selectedSpaceId]);

  // Calendar Day Generation
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get matching events for a specific day
  const getEventsForDay = (day: Date) => {
    const dayBookings = filteredBookings.filter(b => {
      if (b.status === 'cancelled') return false;
      const bStart = startOfDay(parseISO(b.check_in));
      const bEnd = endOfDay(parseISO(b.check_out));
      return isWithinInterval(day, { start: bStart, end: bEnd });
    });

    const dayBlocked = filteredBlockedDates.filter(b => {
      const bStart = startOfDay(parseISO(b.start_date));
      const bEnd = endOfDay(parseISO(b.end_date));
      return isWithinInterval(day, { start: bStart, end: bEnd });
    });

    return {
      bookings: dayBookings,
      blocked: dayBlocked
    };
  };

  // Sync All Trigger
  const handleSyncAll = async () => {
    setIsSyncing(true);
    toast.loading('Synchronizing all external iCal channels...');
    try {
      const res = await fetch('/api/spaces/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      toast.dismiss();

      if (res.ok && data.success) {
        toast.success(`Sync complete! ${data.synced || 0} external calendar feeds synced.`);
        // Refresh blocked dates from API
        const refreshRes = await fetch('/api/admin/blocked-dates');
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setBlockedDates(refreshData.blockedDates || []);
        }
      } else {
        toast.error(data.error || 'Sync encountered errors');
      }
    } catch {
      toast.dismiss();
      toast.error('Failed to execute sync');
    } finally {
      setIsSyncing(false);
    }
  };

  // Submit Block Dates
  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockSubmitting(true);
    try {
      const res = await fetch('/api/admin/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: blockSpaceId,
          start_date: blockStartDate,
          end_date: blockEndDate,
          summary: blockSummary
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Dates blocked successfully!');
        setBlockedDates(prev => [...prev, data.blockedDate]);
        setShowBlockModal(false);
      } else {
        toast.error(data.error || 'Failed to block dates');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error blocking dates');
    } finally {
      setBlockSubmitting(false);
    }
  };

  // Delete Blocked Date
  const handleDeleteBlockedDate = async (id: string) => {
    if (!confirm('Are you sure you want to unblock this date range?')) return;
    try {
      const res = await fetch(`/api/admin/blocked-dates?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Date unblocked');
        setBlockedDates(prev => prev.filter(b => b.id !== id));
        setSelectedEvent(null);
      } else {
        toast.error(data.error || 'Failed to unblock');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error unblocking date');
    }
  };

  // Add Channel Source
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: newSource, error: insertError } = await supabase
        .from('calendar_sync_sources')
        .insert({
          space_id: selectedSpaceForChannel,
          platform: newPlatform,
          inbound_ical_url: newIcalUrl.trim(),
          is_active: true,
          sync_status: 'pending'
        })
        .select(`
          id, space_id, platform, inbound_ical_url, is_active, last_synced_at, sync_status, sync_error,
          spaces (id, title, slug)
        `)
        .single();

      if (insertError) throw insertError;

      setSyncSources(prev => [newSource as any, ...prev]);
      toast.success('Channel linked! Triggering first sync...');
      setShowAddChannelModal(false);
      setNewIcalUrl('');
      await handleSyncAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add channel');
    } finally {
      setChannelSubmitting(false);
    }
  };

  const copyOutboundUrl = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nothingness.asia';
    const url = `${origin}/api/spaces/${slug}/ical`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    toast.success('Outbound iCal URL copied to clipboard!');
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-white">Master Calendar &amp; Channel Manager</h1>
          <p className="text-white/50 text-sm tracking-wide mt-1">
            Real-time unified availability, multi-platform 2-way sync, and date blocking.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab(activeTab === 'calendar' ? 'channels' : 'calendar')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <Radio className="w-4 h-4 text-accent-gold" />
            {activeTab === 'calendar' ? 'Channel Integrations' : 'View Calendar'}
          </button>

          <button
            onClick={() => setShowBlockModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border border-white/10"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            Block Dates
          </button>

          <Link
            href="/admin/bookings/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-gold hover:bg-white text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Reservation
          </Link>

          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all disabled:opacity-50"
            title="Sync all channels now"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-accent-gold' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main View Toggle */}
      {activeTab === 'calendar' ? (
        <div className="space-y-6">
          
          {/* Calendar Controls & Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            
            {/* Month Navigator */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h2 className="font-serif text-xl sm:text-2xl text-white min-w-[180px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>

              <button
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setCurrentMonth(new Date())}
                className="text-[11px] font-mono px-3 py-1 bg-white/5 hover:bg-white/10 rounded-md text-white/50 hover:text-white border border-white/10 transition-colors"
              >
                Today
              </button>
            </div>

            {/* Sanctuary Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedSpaceId('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  selectedSpaceId === 'all'
                    ? 'bg-accent-gold text-black font-bold shadow-md'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                All Sanctuaries ({spaces.length})
              </button>
              {spaces.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSpaceId(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                    selectedSpaceId === s.id
                      ? 'bg-accent-gold text-black font-bold shadow-md'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-white/50 px-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Direct Booking
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Airbnb Sync
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Booking.com / VRBO
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> Maintenance / Blocked
            </span>
          </div>

          {/* Month Grid */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.01] text-center text-[11px] font-mono font-bold uppercase tracking-widest text-white/40 py-3">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-white/5">
              {/* Empty leading padding */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[110px] p-2 bg-black/40 opacity-20" />
              ))}

              {daysInMonth.map((day) => {
                const { bookings: dayBookings, blocked: dayBlocked } = getEventsForDay(day);
                const hasEvents = dayBookings.length > 0 || dayBlocked.length > 0;
                const isCurrent = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => {
                      if (!hasEvents) {
                        setBlockStartDate(format(day, 'yyyy-MM-dd'));
                        setBlockEndDate(format(day, 'yyyy-MM-dd'));
                        setShowBlockModal(true);
                      }
                    }}
                    className={`min-h-[110px] p-2 transition-colors relative group cursor-pointer ${
                      isCurrent ? 'bg-accent-gold/[0.03]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-mono font-bold ${
                        isCurrent 
                          ? 'w-6 h-6 rounded-full bg-accent-gold text-black flex items-center justify-center' 
                          : 'text-white/70 group-hover:text-white'
                      }`}>
                        {format(day, 'd')}
                      </span>

                      {!hasEvents && (
                        <span className="text-[10px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          + Block
                        </span>
                      )}
                    </div>

                    {/* Events List */}
                    <div className="space-y-1 overflow-hidden">
                      {/* Direct Bookings */}
                      {dayBookings.map((b) => {
                        const guestName = b.booking_guests?.[0]?.guest_profiles?.full_name 
                          || b.booking_guests?.[0]?.name 
                          || 'Direct Guest';
                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent({ type: 'booking', data: b });
                            }}
                            className="p-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-lg text-amber-200 text-[10px] font-mono leading-tight hover:border-amber-400 transition-all truncate flex items-center justify-between"
                          >
                            <span className="truncate font-semibold">{b.spaces?.title}: {guestName}</span>
                            <span className="text-[9px] text-amber-400 font-bold ml-1">₹{b.total_price?.toLocaleString()}</span>
                          </div>
                        );
                      })}

                      {/* Blocked Dates / External iCal Syncs */}
                      {dayBlocked.map((b) => {
                        const isAirbnb = b.summary?.toLowerCase().includes('airbnb') || b.summary?.toLowerCase().includes('reserved');
                        const isBookingCom = b.summary?.toLowerCase().includes('booking.com') || b.summary?.toLowerCase().includes('vrbo');

                        const badgeColor = isAirbnb
                          ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                          : isBookingCom
                          ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                          : 'bg-zinc-800/80 border-zinc-700 text-zinc-300';

                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent({ type: 'blocked', data: b });
                            }}
                            className={`p-1.5 border rounded-lg text-[10px] font-mono leading-tight hover:brightness-125 transition-all truncate flex items-center justify-between ${badgeColor}`}
                          >
                            <span className="truncate">{b.spaces?.title}: {b.summary}</span>
                            <Lock className="w-2.5 h-2.5 opacity-60 flex-shrink-0 ml-1" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* CHANNELS & ICAL SYNC INTEGRATION VIEW */
        <div className="space-y-8 animate-in fade-in">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Active Sync Sources</p>
              <p className="text-2xl font-serif text-white">{syncSources.filter(s => s.is_active).length} / {syncSources.length}</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Healthy Feeds</p>
              <p className="text-2xl font-serif text-green-400 flex items-center gap-2">
                {syncSources.filter(s => s.sync_status === 'success').length}
                <CheckCircle2 className="w-4 h-4 text-green-400/60" />
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Blocked External Dates</p>
              <p className="text-2xl font-serif text-accent-gold">{blockedDates.length} Dates</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Auto-Sync Frequency</p>
              <p className="text-2xl font-serif text-white flex items-center gap-2">
                Every 15m
                <Clock className="w-4 h-4 text-white/40" />
              </p>
            </div>
          </div>

          {/* Space-by-Space Channel Cards */}
          <div className="space-y-6">
            {spaces.map((space) => {
              const spaceSources = syncSources.filter(s => s.space_id === space.id);

              return (
                <div key={space.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
                  
                  {/* Space Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="font-serif text-2xl text-white">{space.title}</h3>
                      <p className="text-xs text-white/40 mt-0.5">Two-way iCal integration for Airbnb, Booking.com &amp; VRBO.</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSpaceForChannel(space.id);
                        setShowAddChannelModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors border border-white/10"
                    >
                      <Plus className="w-3.5 h-3.5" /> Connect Platform Feed
                    </button>
                  </div>

                  {/* Outbound Feed Link */}
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-accent-gold font-bold">
                      Outbound iCal Export (Copy to Airbnb / Booking.com)
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : 'https://nothingness.asia'}/api/spaces/${space.slug}/ical`}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white/70 font-mono focus:outline-none"
                      />
                      <button
                        onClick={() => copyOutboundUrl(space.slug)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-accent-gold/10 hover:bg-accent-gold text-accent-gold hover:text-black rounded-lg text-xs font-bold transition-all border border-accent-gold/30 whitespace-nowrap"
                      >
                        {copiedSlug === space.slug ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedSlug === space.slug ? 'Copied' : 'Copy Export URL'}
                      </button>
                    </div>
                  </div>

                  {/* Inbound Feeds List */}
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Connected Inbound Feeds</p>
                    
                    {spaceSources.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {spaceSources.map((source) => (
                          <div key={source.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="capitalize text-xs font-bold text-white">{source.platform}</span>
                                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                                  source.sync_status === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                  source.sync_status === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                  'bg-accent-gold/20 text-accent-gold border border-accent-gold/30'
                                }`}>
                                  {source.sync_status || 'Pending'}
                                </span>
                              </div>
                              <p className="text-[10px] text-white/40 font-mono truncate max-w-xs">{source.inbound_ical_url}</p>
                            </div>
                            
                            <a
                              href={source.inbound_ical_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-white/30 hover:text-white transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/30 italic py-2">No external channels connected yet for this space.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            {selectedEvent.type === 'booking' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-accent-gold uppercase tracking-wider">
                  <CalendarIcon className="w-4 h-4" /> Direct Reservation Details
                </div>
                <h2 className="font-serif text-2xl text-white">{selectedEvent.data.spaces?.title}</h2>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Check-In:</span>
                    <span className="text-white font-mono">{format(parseISO(selectedEvent.data.check_in), 'EEE, MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Check-Out:</span>
                    <span className="text-white font-mono">{format(parseISO(selectedEvent.data.check_out), 'EEE, MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Total Tariff:</span>
                    <span className="text-accent-gold font-bold font-mono">₹{selectedEvent.data.total_price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Status:</span>
                    <span className="text-green-400 uppercase font-mono font-bold">{selectedEvent.data.status}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link
                    href={`/admin/bookings`}
                    className="flex-1 py-3 bg-accent-gold hover:bg-white text-black font-bold rounded-xl text-xs text-center transition-colors"
                  >
                    View in Bookings Tab
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-rose-400 uppercase tracking-wider">
                  <Lock className="w-4 h-4" /> Blocked Date / External Channel
                </div>
                <h2 className="font-serif text-2xl text-white">{selectedEvent.data.spaces?.title}</h2>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Period:</span>
                    <span className="text-white font-mono">
                      {format(parseISO(selectedEvent.data.start_date), 'MMM dd')} - {format(parseISO(selectedEvent.data.end_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Summary:</span>
                    <span className="text-white font-medium">{selectedEvent.data.summary}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteBlockedDate(selectedEvent.data.id)}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Unblock This Date Range
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BLOCK DATES MODAL */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setShowBlockModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-rose-400 uppercase tracking-wider">
              <Lock className="w-4 h-4" /> Quick Date Blocker
            </div>
            <h2 className="font-serif text-2xl text-white">Block Dates for Maintenance</h2>

            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Select Sanctuary</label>
                <select
                  value={blockSpaceId}
                  onChange={(e) => setBlockSpaceId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                >
                  {spaces.map(s => (
                    <option key={s.id} value={s.id} className="bg-black text-white">{s.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Reason / Note</label>
                <input
                  type="text"
                  required
                  value={blockSummary}
                  onChange={(e) => setBlockSummary(e.target.value)}
                  placeholder="e.g., Deep clean, plumbing check, private VIP hold"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={blockSubmitting}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 mt-4"
              >
                {blockSubmitting ? 'Blocking Dates...' : 'Confirm Block'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONNECT CHANNEL MODAL */}
      {showAddChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setShowAddChannelModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-accent-gold uppercase tracking-wider">
              <Link2 className="w-4 h-4" /> Connect External OTA Feed
            </div>
            <h2 className="font-serif text-2xl text-white">Import Calendar from Platform</h2>

            <form onSubmit={handleAddChannel} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Booking Platform</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none"
                >
                  <option value="airbnb" className="bg-black text-white">Airbnb (iCal link)</option>
                  <option value="booking.com" className="bg-black text-white">Booking.com</option>
                  <option value="vrbo" className="bg-black text-white">VRBO / HomeAway</option>
                  <option value="custom" className="bg-black text-white">Custom iCal (.ics URL)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Inbound iCal Feed URL</label>
                <input
                  type="url"
                  required
                  value={newIcalUrl}
                  onChange={(e) => setNewIcalUrl(e.target.value)}
                  placeholder="https://www.airbnb.com/calendar/ical/12345.ics?s=..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={channelSubmitting || !newIcalUrl.trim()}
                className="w-full py-3 bg-accent-gold hover:bg-white text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 mt-4"
              >
                {channelSubmitting ? 'Connecting...' : 'Connect & Sync Channel'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
