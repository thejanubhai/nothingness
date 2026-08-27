'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isToday, parseISO, isWithinInterval, startOfDay, endOfDay,
  differenceInCalendarDays, formatDistanceToNow
} from 'date-fns';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  RefreshCw, Link2, Copy, Check, Trash2,
  ExternalLink, X, Lock, CheckCircle2, 
  Clock, Radio, ShieldCheck, MessageSquare, Share2,
  AlertTriangle, ArrowRight, UserCheck, Phone, DollarSign, Sparkles
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
  payment_method?: string;
  total_price: number;
  guests?: number;
  user_id?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  spaces?: {
    id: string;
    title: string;
    slug: string;
  };
  booking_guests?: Array<{
    id?: string;
    name?: string;
    verification_token?: string;
    verification_status?: string;
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
  const [showQuickActionModal, setShowQuickActionModal] = useState<boolean>(false);
  const [quickActionDate, setQuickActionDate] = useState<string>('');
  const [quickActionTab, setQuickActionTab] = useState<'block' | 'booking'>('block');

  // Quick Action Form State
  const [quickSpaceId, setQuickSpaceId] = useState<string>(spaces[0]?.id || '');
  const [quickStartDate, setQuickStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [quickEndDate, setQuickEndDate] = useState<string>(format(addMonths(new Date(), 0), 'yyyy-MM-dd'));
  const [quickSummary, setQuickSummary] = useState<string>('Maintenance & Deep Cleaning');
  
  // Fast Reservation State
  const [quickGuestName, setQuickGuestName] = useState<string>('');
  const [quickGuestPhone, setQuickGuestPhone] = useState<string>('');
  const [quickTotalPrice, setQuickTotalPrice] = useState<number>(15000);
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<string>('UPI');
  const [quickSubmitting, setQuickSubmitting] = useState<boolean>(false);

  // Channel Modal State
  const [showAddChannelModal, setShowAddChannelModal] = useState<boolean>(false);
  const [selectedSpaceForChannel, setSelectedSpaceForChannel] = useState<string>(spaces[0]?.id || '');
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

  // Sync Health Check
  const brokenSource = useMemo(() => {
    return syncSources.find(s => s.is_active && s.sync_status === 'error');
  }, [syncSources]);

  // Latest Sync Relative Time
  const latestSyncTime = useMemo(() => {
    const activeDates = syncSources
      .filter(s => s.is_active && s.last_synced_at)
      .map(s => new Date(s.last_synced_at!).getTime());
    if (activeDates.length === 0) return null;
    const maxTime = Math.max(...activeDates);
    return formatDistanceToNow(new Date(maxTime), { addSuffix: true });
  }, [syncSources]);

  // Monthly Financial & Occupancy KPI calculations
  const monthKpis = useMemo(() => {
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const activeMonthBookings = filteredBookings.filter(b => {
      if (b.status === 'cancelled') return false;
      return (b.check_in <= monthEnd && b.check_out >= monthStart);
    });

    const totalRevenue = activeMonthBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

    // Calculate booked nights in current month
    const daysInCurrentMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    let totalBookedNights = 0;

    daysInCurrentMonth.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const hasBooking = activeMonthBookings.some(b => b.check_in <= dayStr && b.check_out > dayStr);
      if (hasBooking) totalBookedNights++;
    });

    const activeSpacesCount = selectedSpaceId === 'all' ? Math.max(spaces.length, 1) : 1;
    const totalPossibleNights = daysInCurrentMonth.length * activeSpacesCount;
    const occupancyRate = Math.min(100, Math.round((totalBookedNights / totalPossibleNights) * 100));

    return {
      revenue: totalRevenue,
      occupancy: occupancyRate,
      bookingsCount: activeMonthBookings.length
    };
  }, [filteredBookings, currentMonth, selectedSpaceId, spaces]);

  // Today's Movements (Arrivals & Departures)
  const todayMovements = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const arrivals = bookings.filter(b => {
      if (b.status === 'cancelled') return false;
      return b.check_in.split('T')[0] === todayStr;
    });

    const departures = bookings.filter(b => {
      if (b.status === 'cancelled') return false;
      return b.check_out.split('T')[0] === todayStr;
    });

    return { arrivals, departures };
  }, [bookings]);

  // Calendar Day Generation
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get matching events for a specific day (Night-based matching)
  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');

    const dayBookings = filteredBookings.filter(b => {
      if (b.status === 'cancelled') return false;
      const startStr = b.check_in.split('T')[0];
      const endStr = b.check_out.split('T')[0];
      if (startStr === endStr) {
        return dayStr === startStr;
      }
      return dayStr >= startStr && dayStr < endStr;
    });

    const dayBlocked = filteredBlockedDates.filter(b => {
      const startStr = b.start_date.split('T')[0];
      const endStr = b.end_date.split('T')[0];
      if (startStr === endStr) {
        return dayStr === startStr;
      }
      return dayStr >= startStr && dayStr < endStr;
    });

    return {
      bookings: dayBookings,
      blocked: dayBlocked
    };
  };

  // Sync All Trigger
  const handleSyncAll = async (silent: boolean = false) => {
    setIsSyncing(true);
    if (!silent) toast.loading('Synchronizing all external iCal channels...');
    try {
      const res = await fetch('/api/spaces/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!silent) toast.dismiss();

      if (res.ok && data.success) {
        if (!silent) toast.success(`Sync complete! ${data.synced || 0} external calendar feeds synced.`);
        // Refresh blocked dates and sync status
        const refreshRes = await fetch('/api/admin/blocked-dates');
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setBlockedDates(refreshData.blockedDates || []);
        }
      } else {
        if (!silent) toast.error(data.error || 'Sync encountered errors');
      }
    } catch {
      if (!silent) {
        toast.dismiss();
        toast.error('Failed to execute sync');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync on mount if stale
  useEffect(() => {
    const tenMinsAgo = Date.now() - 10 * 60 * 1000;
    const shouldSync = syncSources.some(s => s.is_active && (!s.last_synced_at || new Date(s.last_synced_at).getTime() < tenMinsAgo));
    if (shouldSync) {
      handleSyncAll(true);
    }
  }, []);

  // Open Quick Action for clicked Day
  const handleDayClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const nextDayStr = format(addMonths(day, 0), 'yyyy-MM-dd'); // default next day
    const nextDate = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    
    setQuickActionDate(dateStr);
    setQuickStartDate(dateStr);
    setQuickEndDate(format(nextDate, 'yyyy-MM-dd'));
    setQuickSpaceId(selectedSpaceId !== 'all' ? selectedSpaceId : (spaces[0]?.id || ''));
    setShowQuickActionModal(true);
  };

  // Submit Quick Block / Fast Reservation
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickSubmitting(true);

    try {
      if (quickActionTab === 'block') {
        const res = await fetch('/api/admin/blocked-dates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            space_id: quickSpaceId,
            start_date: quickStartDate,
            end_date: quickEndDate,
            summary: quickSummary
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success('Dates blocked successfully!');
          setBlockedDates(prev => [...prev, data.blockedDate]);
          setShowQuickActionModal(false);
        } else {
          toast.error(data.error || 'Failed to block dates');
        }
      } else {
        // Fast Reservation
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        const { data: newBooking, error: bErr } = await supabase
          .from('bookings')
          .insert({
            space_id: quickSpaceId,
            check_in: quickStartDate,
            check_out: quickEndDate,
            guest_name: quickGuestName.trim(),
            guest_phone: quickGuestPhone.trim(),
            total_price: quickTotalPrice,
            payment_method: quickPaymentMethod,
            payment_status: 'paid',
            status: 'confirmed',
            guests: 2
          })
          .select(`
            id, space_id, check_in, check_out, status, payment_status, payment_method, total_price, guests,
            guest_name, guest_phone, guest_email,
            spaces (id, title, slug)
          `)
          .single();

        if (bErr) throw bErr;

        // Add primary guest entry
        if (newBooking) {
          await supabase.from('booking_guests').insert({
            booking_id: newBooking.id,
            guest_index: 0,
            name: quickGuestName.trim(),
            phone: quickGuestPhone.trim(),
            verification_status: 'pending'
          });
        }

        toast.success(`Reservation confirmed for ${quickGuestName}!`);
        setBookings(prev => [newBooking as any, ...prev]);
        setShowQuickActionModal(false);
        setQuickGuestName('');
        setQuickGuestPhone('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing request');
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Unblock
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

  // WhatsApp Helpers
  const openWhatsAppChat = (phone: string, guestName: string, spaceTitle: string) => {
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const text = `Namaste ${guestName}! ✨ Regarding your stay at Nothingness (${spaceTitle || 'The Chamber'})...`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareVerificationLinkWhatsApp = (bookingId: string, guestPhone?: string, guestName?: string, spaceTitle?: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nothingness.asia';
    const inviteUrl = `${origin}/verify-guest/invite?booking=${bookingId}`;
    const message = `Namaste! ✨ You are invited for a stay at Nothingness (${spaceTitle || 'The Chamber'}).\n\nPlease complete your 30-second digital ID check-in here:\n${inviteUrl}`;
    
    if (guestPhone) {
      const cleanDigits = guestPhone.replace(/[^0-9]/g, '');
      const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
    toast.success('Opening WhatsApp with digital check-in link!');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-accent-gold/10 text-accent-gold border border-accent-gold/20 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {latestSyncTime ? `Live Sync (${latestSyncTime})` : 'Live 2-Way Sync'}
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-white">Master Calendar &amp; Channel Manager</h1>
          <p className="text-white/50 text-xs md:text-sm tracking-wide mt-0.5">
            2-Way OTA sync (Airbnb &amp; MMT), quick reservations, instant date blocking, and guest check-ins.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          <Link
            href="/admin/guests/police-register"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-green-400" />
            Police Register
          </Link>

          <button
            onClick={() => setActiveTab(activeTab === 'calendar' ? 'channels' : 'calendar')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <Radio className="w-4 h-4 text-accent-gold" />
            {activeTab === 'calendar' ? 'iCal Channels' : 'View Calendar'}
          </button>

          <button
            onClick={() => {
              setQuickActionTab('block');
              setShowQuickActionModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border border-white/10"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            Block Dates
          </button>

          <button
            onClick={() => {
              setQuickActionTab('booking');
              setShowQuickActionModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-gold hover:bg-white text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Quick Book
          </button>

          <button
            onClick={() => handleSyncAll(false)}
            disabled={isSyncing}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all disabled:opacity-50"
            title="Sync all channels now"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-accent-gold' : ''}`} />
          </button>
        </div>
      </div>

      {/* FEED HEALTH ALERT BANNER (Item 4) */}
      {brokenSource && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-400 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider text-red-300">Channel Feed Warning:</span>{' '}
              <span>{brokenSource.platform.toUpperCase()} feed for {brokenSource.spaces?.title} returned an error. ({brokenSource.sync_error || 'Connection failed'})</span>
            </div>
          </div>
          <button
            onClick={() => handleSyncAll(false)}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-white font-bold rounded-lg transition-colors uppercase font-mono text-[11px] whitespace-nowrap"
          >
            Retry Sync Now
          </button>
        </div>
      )}

      {/* MONTHLY FINANCIAL & OCCUPANCY KPI METRICS (Item 12) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">
            {format(currentMonth, 'MMMM yyyy')} Gross Tariff
          </p>
          <p className="text-2xl font-serif text-accent-gold flex items-center justify-between">
            ₹{monthKpis.revenue.toLocaleString('en-IN')}
            <DollarSign className="w-5 h-5 text-accent-gold/40" />
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">
            {format(currentMonth, 'MMMM yyyy')} Occupancy
          </p>
          <p className="text-2xl font-serif text-white flex items-center justify-between">
            {monthKpis.occupancy}%
            <CalendarIcon className="w-5 h-5 text-white/40" />
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">
            Active Month Stays
          </p>
          <p className="text-2xl font-serif text-green-400 flex items-center justify-between">
            {monthKpis.bookingsCount} Reservations
            <Sparkles className="w-5 h-5 text-green-400/50" />
          </p>
        </div>
      </div>

      {/* TODAY'S MOVEMENTS WIDGET (Item 10) */}
      {(todayMovements.arrivals.length > 0 || todayMovements.departures.length > 0) && (
        <div className="bg-gradient-to-r from-accent-gold/10 via-white/[0.02] to-transparent border border-accent-gold/20 rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-gold" />
              Today's Sanctuary Movements ({format(new Date(), 'dd MMMM yyyy')})
            </h3>
            <span className="text-[10px] text-accent-gold font-mono">Instant Dispatch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Arrivals */}
            {todayMovements.arrivals.map(b => (
              <div key={b.id} className="bg-black/50 border border-green-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs font-bold text-white">{b.guest_name || 'Guest'}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">Arriving Today</span>
                  </div>
                  <p className="text-[11px] text-white/50 font-mono mt-0.5">{b.spaces?.title} • {b.guest_phone || 'No phone'}</p>
                </div>
                {b.guest_phone && (
                  <button
                    onClick={() => openWhatsAppChat(b.guest_phone!, b.guest_name || 'Guest', b.spaces?.title || '')}
                    className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                    title="Send WhatsApp message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {/* Departures */}
            {todayMovements.departures.map(b => (
              <div key={b.id} className="bg-black/50 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-xs font-bold text-white">{b.guest_name || 'Guest'}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono">Departing Today</span>
                  </div>
                  <p className="text-[11px] text-white/50 font-mono mt-0.5">{b.spaces?.title} • Turnover needed</p>
                </div>
                <Link
                  href="/admin/housekeeping"
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] uppercase font-mono"
                >
                  Turnover
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Booking.com / MMT
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
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[110px] sm:min-h-[130px] bg-white/[0.005] opacity-20 p-2" />
              ))}

              {daysInMonth.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isCurrentDay = isToday(day);
                const { bookings: dayBookings, blocked: dayBlocked } = getEventsForDay(day);
                const hasEvents = dayBookings.length > 0 || dayBlocked.length > 0;

                return (
                  <div
                    key={dayStr}
                    onClick={() => {
                      if (!hasEvents) handleDayClick(day);
                    }}
                    className={`min-h-[110px] sm:min-h-[130px] p-2 transition-all flex flex-col justify-between group relative cursor-pointer ${
                      isCurrentDay ? 'bg-accent-gold/[0.03] ring-1 ring-accent-gold/40' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-medium rounded-full w-6 h-6 flex items-center justify-center ${
                        isCurrentDay ? 'bg-accent-gold text-black font-bold' : 'text-white/70'
                      }`}>
                        {format(day, 'd')}
                      </span>

                      {!hasEvents && (
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-accent-gold font-mono transition-opacity">
                          + Action
                        </span>
                      )}
                    </div>

                    {/* Events Container */}
                    <div className="space-y-1.5 my-1">
                      {/* Direct / Platform Bookings */}
                      {dayBookings.map((b) => {
                        const guestName = b.guest_name || b.booking_guests?.[0]?.name || 'Booked';
                        const isStart = b.check_in.split('T')[0] === dayStr;

                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent({ type: 'booking', data: b });
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono hover:bg-amber-500/25 transition-colors cursor-pointer truncate shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate font-semibold">{guestName}</span>
                              {isStart && <span className="text-[8px] bg-amber-400 text-black px-1 rounded font-bold">IN</span>}
                            </div>
                          </div>
                        );
                      })}

                      {/* External Blocked Dates */}
                      {dayBlocked.map((b) => {
                        const isAirbnb = b.summary.toLowerCase().includes('airbnb') || b.summary.toLowerCase().includes('res:');
                        const isStart = b.start_date.split('T')[0] === dayStr;

                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent({ type: 'blocked', data: b });
                            }}
                            className={`p-1.5 rounded-lg text-[11px] font-mono transition-colors cursor-pointer truncate shadow-xs border ${
                              isAirbnb
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
                                : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700/80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate font-medium">{b.summary}</span>
                              {isStart && <span className="text-[8px] bg-white/20 text-white px-1 rounded">IN</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[9px] text-white/20 font-mono text-right">
                      {spaces[0]?.nightly_price ? `₹${spaces[0].nightly_price / 1000}k` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Channels Tab */
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <div>
              <h2 className="font-serif text-xl text-white">Outbound iCal Feeds (For Airbnb &amp; MakeMyTrip)</h2>
              <p className="text-xs text-white/50 mt-0.5">
                Paste these exact links into Airbnb &amp; MakeMyTrip to automatically block reserved dates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spaces.map(s => (
              <div key={s.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-lg text-white">{s.title}</h3>
                  <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded font-mono border border-green-500/20">Live Sync</span>
                </div>
                <div className="flex items-center gap-2 bg-black/60 border border-white/10 p-2.5 rounded-xl">
                  <input
                    readOnly
                    value={`https://nothingness.asia/api/spaces/${s.slug}/calendar.ics`}
                    className="w-full bg-transparent text-xs text-white/70 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://nothingness.asia/api/spaces/${s.slug}/calendar.ics`);
                      toast.success('Outbound iCal URL copied!');
                    }}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK ACTION MODAL (BLOCK DATES / FAST RESERVATION) */}
      {showQuickActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowQuickActionModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setQuickActionTab('block')}
                className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  quickActionTab === 'block' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                🔒 Block Dates
              </button>
              <button
                type="button"
                onClick={() => setQuickActionTab('booking')}
                className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  quickActionTab === 'booking' ? 'bg-accent-gold text-black font-bold shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                ✨ Fast Reservation
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-4">
              {/* Space Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Sanctuary</label>
                <select
                  value={quickSpaceId}
                  onChange={(e) => setQuickSpaceId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-gold"
                >
                  {spaces.map(s => (
                    <option key={s.id} value={s.id} className="bg-black text-white">{s.title}</option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={quickStartDate}
                    onChange={(e) => setQuickStartDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-gold [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Check-out Date</label>
                  <input
                    type="date"
                    required
                    value={quickEndDate}
                    onChange={(e) => setQuickEndDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-gold [color-scheme:dark]"
                  />
                </div>
              </div>

              {quickActionTab === 'block' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Reason for Block</label>
                  <input
                    type="text"
                    required
                    value={quickSummary}
                    onChange={(e) => setQuickSummary(e.target.value)}
                    placeholder="e.g. Maintenance, VIP Hold, Private"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Primary Guest Full Name</label>
                    <input
                      type="text"
                      required
                      value={quickGuestName}
                      onChange={(e) => setQuickGuestName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-gold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={quickGuestPhone}
                        onChange={(e) => setQuickGuestPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-gold font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Total Tariff (₹)</label>
                      <input
                        type="number"
                        required
                        value={quickTotalPrice}
                        onChange={(e) => setQuickTotalPrice(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-gold font-mono"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector (Item 11) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Payment Method Mode</label>
                    <select
                      value={quickPaymentMethod}
                      onChange={(e) => setQuickPaymentMethod(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-gold"
                    >
                      <option value="UPI" className="bg-black text-white">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Cash" className="bg-black text-white">Direct Cash</option>
                      <option value="PayU" className="bg-black text-white">PayU Online Gateway</option>
                      <option value="Airbnb Payout" className="bg-black text-white">Airbnb Payout</option>
                      <option value="MakeMyTrip Payout" className="bg-black text-white">MakeMyTrip Payout</option>
                      <option value="Bank Transfer" className="bg-black text-white">Direct Bank NEFT/IMPS</option>
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={quickSubmitting}
                className="w-full py-3.5 bg-accent-gold hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl disabled:opacity-50 mt-4"
              >
                {quickSubmitting ? 'Saving...' : (quickActionTab === 'block' ? 'Lock Dates' : 'Confirm & Save Reservation')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EVENT DETAIL DRAWER / SLIDE-OVER (Item 3) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {selectedEvent.type === 'booking' ? (
              <div className="space-y-6">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] uppercase font-mono font-bold">
                    Reservation Details
                  </span>
                  <h2 className="font-serif text-2xl text-white mt-2">
                    {selectedEvent.data.guest_name || 'Guest Stay'}
                  </h2>
                  <p className="text-xs text-white/50 font-mono mt-0.5">
                    {selectedEvent.data.spaces?.title} • ID: {selectedEvent.data.id.slice(0, 8)}
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs text-white/80 font-mono">
                  <div className="flex justify-between">
                    <span className="text-white/40">Check-in:</span>
                    <span className="text-white font-bold">{selectedEvent.data.check_in.split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Check-out:</span>
                    <span className="text-white font-bold">{selectedEvent.data.check_out.split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Total Tariff:</span>
                    <span className="text-accent-gold font-bold">₹{Number(selectedEvent.data.total_price || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Payment Mode:</span>
                    <span className="text-green-400 font-bold">{selectedEvent.data.payment_method || 'UPI'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Phone:</span>
                    <span>{selectedEvent.data.guest_phone || 'None'}</span>
                  </div>
                </div>

                {/* WhatsApp Instant Action Buttons (Item 3 & 6) */}
                <div className="space-y-2.5 pt-2">
                  {selectedEvent.data.guest_phone && (
                    <button
                      onClick={() => openWhatsAppChat(
                        selectedEvent.data.guest_phone,
                        selectedEvent.data.guest_name || 'Guest',
                        selectedEvent.data.spaces?.title || ''
                      )}
                      className="w-full py-3 bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" /> Message Guest on WhatsApp
                    </button>
                  )}

                  <button
                    onClick={() => shareVerificationLinkWhatsApp(
                      selectedEvent.data.id,
                      selectedEvent.data.guest_phone,
                      selectedEvent.data.guest_name,
                      selectedEvent.data.spaces?.title
                    )}
                    className="w-full py-3 bg-accent-gold/15 hover:bg-accent-gold/25 border border-accent-gold/30 text-accent-gold rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Share Verification Link on WhatsApp
                  </button>

                  <Link
                    href="/admin/bookings"
                    className="block w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xl text-xs font-semibold text-center uppercase tracking-wider transition-colors"
                  >
                    View All Bookings
                  </Link>
                </div>
              </div>
            ) : (
              /* Blocked Date Detail */
              <div className="space-y-6">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] uppercase font-mono font-bold">
                    Blocked Date Record
                  </span>
                  <h2 className="font-serif text-2xl text-white mt-2">
                    {selectedEvent.data.summary}
                  </h2>
                  <p className="text-xs text-white/50 font-mono mt-0.5">
                    {selectedEvent.data.spaces?.title}
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs text-white/80 font-mono">
                  <div className="flex justify-between">
                    <span className="text-white/40">From:</span>
                    <span>{selectedEvent.data.start_date.split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">To:</span>
                    <span>{selectedEvent.data.end_date.split('T')[0]}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleDeleteBlockedDate(selectedEvent.data.id)}
                    className="flex-1 py-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Unblock Dates
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold uppercase"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
