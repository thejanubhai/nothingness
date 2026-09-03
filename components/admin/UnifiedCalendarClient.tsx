'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isToday, parseISO, isWithinInterval, startOfDay, endOfDay,
  differenceInCalendarDays, formatDistanceToNow
} from 'date-fns';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  RefreshCw, Link2, Copy, Check, Trash2, Edit3,
  ExternalLink, X, Lock, CheckCircle2, 
  Clock, Radio, ShieldCheck, MessageSquare, Share2,
  AlertTriangle, ArrowRight, UserCheck, Phone, DollarSign, Sparkles,
  Search, ShieldAlert, User, Filter, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface Space {
  id: string;
  title: string;
  slug: string;
  nightly_price: number;
  featured_image?: string;
}

export interface BookingGuest {
  id?: string;
  name?: string;
  phone?: string;
  verification_token?: string;
  verification_status?: string;
  guest_index?: number;
  payment_status?: string;
  payment_amount?: number;
  paid_at?: string;
  is_primary?: boolean;
  guest_profiles?: {
    id?: string;
    full_name?: string;
    phone_number?: string;
    document_number?: string;
    is_verified?: boolean;
    photo_url?: string;
    live_face_url?: string;
    face_id_vetted?: boolean;
    id_front_url?: string;
  };
}

export interface Booking {
  id: string;
  space_id: string;
  check_in: string;
  check_out: string;
  status: string;
  payment_status?: string;
  payment_method?: string;
  total_price: number;
  guests?: number;
  default_guests?: number;
  additional_guests_count?: number;
  user_id?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  created_at?: string;
  notes?: string;
  spaces?: {
    id?: string;
    title: string;
    slug?: string;
  };
  booking_guests?: BookingGuest[];
}

export interface BlockedDate {
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

export interface SyncSource {
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
  defaultTab?: 'calendar' | 'bookings' | 'channels';
}

export default function UnifiedCalendarClient({
  initialSpaces,
  initialBookings,
  initialBlockedDates,
  initialSyncSources,
  defaultTab = 'calendar'
}: Props) {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(initialBlockedDates);
  const [syncSources, setSyncSources] = useState<SyncSource[]>(initialSyncSources);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  // Default to first space if exactly 1 space exists, otherwise 'all'
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    initialSpaces.length === 1 ? initialSpaces[0].id : 'all'
  );
  const [activeTab, setActiveTab] = useState<'calendar' | 'bookings' | 'channels'>(defaultTab);

  // Modals & Drawers
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBlockedDate, setSelectedBlockedDate] = useState<BlockedDate | null>(null);
  
  // Edit Booking Modal
  const [isEditingBooking, setIsEditingBooking] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<{
    check_in: string;
    check_out: string;
    guest_name: string;
    guest_phone: string;
    guest_email: string;
    total_price: number;
    payment_method: string;
    status: string;
    payment_status: string;
  }>({
    check_in: '',
    check_out: '',
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    total_price: 0,
    payment_method: 'UPI',
    status: 'confirmed',
    payment_status: 'completed',
  });
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Quick Action Modal (Date Click)
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

  // Table Search & Filters (Reservations Tab)
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryStatusFilter, setRegistryStatusFilter] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filtered Items by Space
  const filteredBookings = useMemo(() => {
    if (selectedSpaceId === 'all') return bookings;
    return bookings.filter(b => b.space_id === selectedSpaceId);
  }, [bookings, selectedSpaceId]);

  const filteredBlockedDates = useMemo(() => {
    if (selectedSpaceId === 'all') return blockedDates;
    return blockedDates.filter(b => b.space_id === selectedSpaceId);
  }, [blockedDates, selectedSpaceId]);

  const filteredSyncSources = useMemo(() => {
    if (selectedSpaceId === 'all') return syncSources;
    return syncSources.filter(s => s.space_id === selectedSpaceId);
  }, [syncSources, selectedSpaceId]);

  // Registry Filtered Bookings
  const registryFilteredBookings = useMemo(() => {
    return filteredBookings.filter((b) => {
      const isAbandoned = isBookingAbandoned(b);
      let matchesStatus = true;
      if (registryStatusFilter === 'all') {
        matchesStatus = true;
      } else if (registryStatusFilter === 'abandoned') {
        matchesStatus = isAbandoned;
      } else if (registryStatusFilter === 'confirmed') {
        matchesStatus = b.status === 'confirmed' || b.status === 'checked_in';
      } else {
        matchesStatus = b.status === registryStatusFilter;
      }

      const ref = b.id.toLowerCase();
      const space = (b.spaces?.title || '').toLowerCase();
      const guest = (b.guest_name || b.booking_guests?.[0]?.name || b.booking_guests?.[0]?.guest_profiles?.full_name || '').toLowerCase();
      const phone = (b.guest_phone || b.booking_guests?.[0]?.phone || '').toLowerCase();
      const query = registrySearch.toLowerCase().trim();

      const matchesSearch = !query || ref.includes(query) || space.includes(query) || guest.includes(query) || phone.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [filteredBookings, registryStatusFilter, registrySearch]);

  // Helper: Check if ID is verified for booking
  function isBookingIdVerified(b: Booking): boolean {
    if (!b.booking_guests || b.booking_guests.length === 0) return false;
    return b.booking_guests.some(
      g => g.verification_status === 'verified' || Boolean(g.guest_profiles?.is_verified)
    );
  }

  // Helper: Check if booking is an unpaid abandoned checkout
  function isBookingAbandoned(b: Booking): boolean {
    if (b.status !== 'pending') return false;
    if (b.payment_status === 'completed' || b.payment_status === 'paid') return false;
    if (!b.created_at) return true;
    const createdTime = new Date(b.created_at).getTime();
    const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
    return createdTime < thirtyMinsAgo;
  }

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
      if (isBookingAbandoned(b)) return false; // exclude unpaid abandoned checkouts
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

    const arrivals = filteredBookings.filter(b => {
      if (b.status === 'cancelled') return false;
      return b.check_in.split('T')[0] === todayStr;
    });

    const departures = filteredBookings.filter(b => {
      if (b.status === 'cancelled') return false;
      return b.check_out.split('T')[0] === todayStr;
    });

    return { arrivals, departures };
  }, [filteredBookings]);

  // Calendar Day Generation
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get matching events for a specific day
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
            payment_status: 'completed',
            status: 'confirmed',
            guests: 2
          })
          .select(`
            id, space_id, check_in, check_out, status, payment_status, payment_method, total_price, guests,
            guest_name, guest_phone, guest_email, created_at,
            spaces (id, title, slug)
          `)
          .single();

        if (bErr) throw bErr;

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

  // Delete Blocked Date
  const handleDeleteBlockedDate = async (id: string) => {
    if (!confirm('Are you sure you want to unblock this date range?')) return;
    try {
      const res = await fetch(`/api/admin/blocked-dates?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Date unblocked');
        setBlockedDates(prev => prev.filter(b => b.id !== id));
        setSelectedBlockedDate(null);
      } else {
        toast.error(data.error || 'Failed to unblock');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error unblocking date');
    }
  };

  // Open Edit Booking Modal
  const startEditBooking = (b: Booking) => {
    setEditFormData({
      check_in: b.check_in ? b.check_in.split('T')[0] : '',
      check_out: b.check_out ? b.check_out.split('T')[0] : '',
      guest_name: b.guest_name || '',
      guest_phone: b.guest_phone || '',
      guest_email: b.guest_email || '',
      total_price: Number(b.total_price || 0),
      payment_method: b.payment_method || 'UPI',
      status: b.status || 'confirmed',
      payment_status: b.payment_status || 'completed',
    });
    setIsEditingBooking(true);
  };

  // Save Booking Edits
  const handleSaveBookingEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Reservation updated successfully!');
        setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, ...data.booking } : b));
        setSelectedBooking(prev => prev ? { ...prev, ...data.booking } : null);
        setIsEditingBooking(false);
      } else {
        toast.error(data.error || 'Failed to update reservation');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating reservation');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Update Booking Status (1-click Confirm, Cancel, Check-in, etc.)
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    setActionLoadingId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          payment_status: newStatus === 'confirmed' ? 'completed' : undefined
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Booking marked as ${newStatus}!`);
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus, ...(newStatus === 'confirmed' ? { payment_status: 'completed' } : {}) } : b));
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(prev => prev ? { ...prev, status: newStatus, ...(newStatus === 'confirmed' ? { payment_status: 'completed' } : {}) } : null);
        }
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Network error updating status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Permanently Delete Booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to permanently delete this reservation? This will immediately release the calendar dates.')) {
      return;
    }

    setActionLoadingId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Reservation permanently deleted!');
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        setSelectedBooking(null);
      } else {
        toast.error(data.error || 'Failed to delete booking');
      }
    } catch {
      toast.error('Network error deleting booking');
    } finally {
      setActionLoadingId(null);
    }
  };

  // WhatsApp Digital Check-In / ID Verification Link
  const shareVerificationWhatsApp = (b: Booking) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nothingness.asia';
    const inviteUrl = `${origin}/verify-guest/invite?booking=${b.id}`;
    const message = `Namaste ${b.guest_name || 'Guest'}! ✨ Regarding your reservation at Nothingness (${b.spaces?.title || 'Sanctuary'}).\n\nPlease complete your secure 30-second digital ID check-in here:\n${inviteUrl}`;
    
    if (b.guest_phone) {
      const cleanDigits = b.guest_phone.replace(/[^0-9]/g, '');
      const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
    toast.success('Opened WhatsApp with digital check-in invite link!');
  };

  // Open Direct WhatsApp Chat
  const openWhatsAppChat = (phone: string, guestName: string, spaceTitle: string) => {
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const msg = `Namaste ${guestName}! ✨ Touching base from Nothingness regarding your upcoming stay at ${spaceTitle}.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live OTA 2-Way Sync {latestSyncTime && `(${latestSyncTime})`}
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-white font-bold tracking-tight">
            Master Calendar &amp; Reservations
          </h1>
          <p className="text-white/50 text-xs md:text-sm tracking-wide mt-1">
            Unified channel manager, real-time reservations registry, and digital ID compliance dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSyncAll(false)}
            disabled={isSyncing}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50"
            title="Force Sync Inbound iCal Channels"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <Link
            href="/admin/guests/police-register"
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md"
          >
            <ShieldCheck className="w-4 h-4 text-accent-gold" />
            <span>Police Register</span>
          </Link>

          <button
            onClick={() => {
              setQuickActionTab('block');
              setQuickStartDate(format(new Date(), 'yyyy-MM-dd'));
              setQuickEndDate(format(addMonths(new Date(), 0), 'yyyy-MM-dd'));
              setShowQuickActionModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-rose-500/30 text-rose-300 hover:bg-rose-500/15 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Block Dates</span>
          </button>

          <button
            onClick={() => {
              setQuickActionTab('booking');
              setQuickStartDate(format(new Date(), 'yyyy-MM-dd'));
              setQuickEndDate(format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'));
              setShowQuickActionModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-accent-gold hover:bg-white text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Book</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-accent-gold text-black shadow-md'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Master Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-accent-gold text-black shadow-md'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Reservations Registry ({filteredBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'channels'
                ? 'bg-accent-gold text-black shadow-md'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>OTA Sync Channels</span>
            {brokenSource && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Space Selector Filter (Pill Bar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mr-1">Sanctuary:</span>
          <button
            onClick={() => setSelectedSpaceId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              selectedSpaceId === 'all'
                ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-900'
            }`}
          >
            All Sanctuaries ({spaces.length})
          </button>
          {spaces.map((sp) => (
            <button
              key={sp.id}
              onClick={() => setSelectedSpaceId(sp.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                selectedSpaceId === sp.id
                  ? 'bg-accent-gold/20 text-accent-gold font-bold border border-accent-gold/40'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-900'
              }`}
            >
              {sp.title}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CALENDAR VIEW                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Monthly Financial & Occupancy KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  {format(currentMonth, 'MMMM yyyy')} Gross Tariff
                </span>
                <p className="text-2xl font-bold font-mono text-accent-gold mt-1">
                  ₹{Number(monthKpis.revenue || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  {format(currentMonth, 'MMMM yyyy')} Occupancy
                </span>
                <p className="text-2xl font-bold font-mono text-white mt-1">
                  {monthKpis.occupancy}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
                <CalendarIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  Active Month Stays
                </span>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {monthKpis.bookingsCount} Reservations
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Today's Movements Card */}
          {(todayMovements.arrivals.length > 0 || todayMovements.departures.length > 0) && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Today's Sanctuary Movements ({format(new Date(), 'dd MMMM yyyy')})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {todayMovements.arrivals.map((b) => (
                  <div 
                    key={b.id} 
                    onClick={() => setSelectedBooking(b)}
                    className="p-3 rounded-xl bg-black/50 border border-emerald-500/30 flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-xs font-bold text-white font-mono">{b.guest_name || 'Guest'}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 font-bold">Arriving Today</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono mt-1">{b.spaces?.title} • {b.guest_phone || 'No phone'}</p>
                    </div>
                    {b.guest_phone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openWhatsAppChat(b.guest_phone!, b.guest_name || 'Guest', b.spaces?.title || '');
                        }}
                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {todayMovements.departures.map((b) => (
                  <div 
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="p-3 rounded-xl bg-black/50 border border-rose-500/30 flex items-center justify-between cursor-pointer hover:border-rose-400 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span className="text-xs font-bold text-white font-mono">{b.guest_name || 'Guest'}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-rose-500/20 text-rose-300 font-bold">Checkout Today</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono mt-1">{b.spaces?.title} • {b.guest_phone || 'No phone'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Month Calendar Grid */}
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6">
            {/* Month Navigation & Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="font-serif text-2xl font-bold text-white min-w-[200px]">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white ml-2 cursor-pointer"
                >
                  Today
                </button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px] font-mono flex-wrap">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Direct Booking
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> ID Verified (🟢)
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Airbnb Sync
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> MMT / Booking.com
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" /> Maintenance Block
                </span>
              </div>
            </div>

            {/* Days Grid Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs uppercase tracking-wider text-zinc-500 py-2 border-b border-zinc-800/80">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Calendar Days Cells */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty leading offset days */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`offset-${i}`} className="min-h-[110px] rounded-2xl bg-zinc-950/30 border border-zinc-900/40 p-2 opacity-20" />
              ))}

              {daysInMonth.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const { bookings: dayBookings, blocked: dayBlocked } = getEventsForDay(day);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={dayStr}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[110px] rounded-2xl p-2.5 flex flex-col justify-between transition-all cursor-pointer group border ${
                      isCurrentDay 
                        ? 'bg-amber-950/15 border-amber-500/50 shadow-lg shadow-amber-950/20' 
                        : 'bg-zinc-900/30 hover:bg-zinc-900/70 border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-bold ${
                        isCurrentDay ? 'px-2 py-0.5 rounded-full bg-amber-400 text-black' : 'text-zinc-400 group-hover:text-white'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-600 group-hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100">
                        + Action
                      </span>
                    </div>

                    {/* Events Container */}
                    <div className="space-y-1 my-1">
                      {/* Internal Bookings */}
                      {dayBookings.map((b) => {
                        const isVerified = isBookingIdVerified(b);
                        const isAbandoned = isBookingAbandoned(b);

                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(b);
                            }}
                            className={`p-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer truncate shadow-xs flex items-center justify-between gap-1 border ${
                              isAbandoned
                                ? 'bg-amber-950/30 border-dashed border-amber-500/60 text-amber-300 line-through opacity-85'
                                : b.status === 'confirmed' || b.status === 'checked_in'
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 hover:bg-amber-500/30'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                            }`}
                          >
                            <span className="truncate">
                              {b.guest_name || 'Guest'} {isAbandoned && '(Unpaid)'}
                            </span>
                            <span className="shrink-0" title={isVerified ? "ID Verified" : "ID Vetting Pending"}>
                              {isVerified ? (
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <ShieldAlert className="w-3 h-3 text-amber-400" />
                              )}
                            </span>
                          </div>
                        );
                      })}

                      {/* Synced External Blocks */}
                      {dayBlocked.map((b) => {
                        const isAirbnb = b.summary?.toLowerCase().includes('airbnb');
                        const isMmt = b.summary?.toLowerCase().includes('mmt') || b.summary?.toLowerCase().includes('booking');

                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBlockedDate(b);
                            }}
                            className={`p-1.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer truncate shadow-xs border ${
                              isAirbnb
                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 hover:bg-rose-500/30'
                                : isMmt
                                ? 'bg-sky-500/20 border-sky-500/40 text-sky-200 hover:bg-sky-500/30'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                            }`}
                          >
                            <span className="truncate block">
                              {b.summary || 'Blocked'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[9px] font-mono text-zinc-600 truncate">
                      {spaces[0]?.nightly_price ? `₹${(spaces[0].nightly_price / 1000).toFixed(0)}k` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RESERVATIONS REGISTRY (ALL BOOKINGS TABLE VIEW)                    */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Search & Status Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={registrySearch}
                onChange={(e) => setRegistrySearch(e.target.value)}
                placeholder="Search by ID, guest name, phone..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-1 sm:pb-0">
              {[
                { id: 'all', label: `All (${filteredBookings.length})` },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'pending', label: 'Pending' },
                { id: 'abandoned', label: 'Abandoned / Unpaid' },
                { id: 'checked_in', label: 'Checked In' },
                { id: 'completed', label: 'Completed' },
                { id: 'cancelled', label: 'Cancelled' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setRegistryStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer whitespace-nowrap ${
                    registryStatusFilter === st.id 
                      ? 'bg-accent-gold text-black font-bold shadow-md' 
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Registry Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/50 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-400 font-mono">
                  <tr>
                    <th className="px-6 py-4 font-medium">Sanctuary &amp; ID</th>
                    <th className="px-6 py-4 font-medium">Guest &amp; Contact</th>
                    <th className="px-6 py-4 font-medium">Stay Dates</th>
                    <th className="px-6 py-4 font-medium">ID Vetting Status</th>
                    <th className="px-6 py-4 font-medium">Tariff &amp; Mode</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {registryFilteredBookings.map((b) => {
                    const guestName = b.guest_name || b.booking_guests?.[0]?.name || 'Nothingness Guest';
                    const guestPhone = b.guest_phone || b.booking_guests?.[0]?.phone;
                    const isVerified = isBookingIdVerified(b);
                    const isAbandoned = isBookingAbandoned(b);

                    return (
                      <tr 
                        key={b.id} 
                        onClick={() => setSelectedBooking(b)}
                        className="hover:bg-zinc-900/40 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <p className="text-white font-semibold text-xs">{b.spaces?.title || 'Sanctuary'}</p>
                          <p className="text-zinc-500 text-[10px] mt-0.5">{b.id.slice(0, 8)}</p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            {(() => {
                              const prof = b.booking_guests?.[0]?.guest_profiles;
                              const avatarImg = prof?.live_face_url || prof?.photo_url;
                              return (
                                <div className="w-8 h-9 rounded-lg overflow-hidden bg-black border border-zinc-800 shrink-0 flex items-center justify-center relative shadow-xs">
                                  {avatarImg ? (
                                    <img src={avatarImg} alt={guestName} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-3.5 h-3.5 text-zinc-600" />
                                  )}
                                  {prof?.face_id_vetted && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-black shadow-xs" title="3D Face ID Vetted" />
                                  )}
                                </div>
                              );
                            })()}
                            <div>
                              <p className="text-white font-medium">{guestName}</p>
                              {guestPhone && <p className="text-zinc-400 text-[11px] mt-0.5">{guestPhone}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-zinc-300">
                          {format(new Date(b.check_in), 'MMM dd')} → {format(new Date(b.check_out), 'MMM dd, yyyy')}
                        </td>

                        <td className="px-6 py-4 space-y-1">
                          <div>
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Verified ID</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                                <ShieldAlert className="w-3 h-3" />
                                <span>Vetting Pending</span>
                              </span>
                            )}
                          </div>
                          {b.booking_guests?.[0]?.guest_profiles?.face_id_vetted && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold">
                                ✓ 3D Face ID
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-white font-bold text-xs">₹{Number(b.total_price || 0).toLocaleString('en-IN')}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold">
                            {b.payment_method || 'UPI'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-bold ${
                            b.status === 'confirmed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                            b.status === 'checked_in' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
                            b.status === 'cancelled' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                            isAbandoned ? 'text-zinc-400 bg-zinc-900 border-zinc-700' :
                            'text-amber-400 bg-amber-500/10 border-amber-500/30'
                          }`}>
                            {isAbandoned ? 'Abandoned (Unpaid)' : b.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => shareVerificationWhatsApp(b)}
                              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
                              title="Share WhatsApp ID Link"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedBooking(b)}
                              className="px-2.5 py-1 rounded-lg bg-accent-gold/15 border border-accent-gold/30 text-accent-gold text-[10px] font-bold uppercase tracking-wider hover:bg-accent-gold/25 transition-colors"
                            >
                              Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {registryFilteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-mono">
                        No reservations found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OTA SYNC CHANNELS (AIRBNB & MMT)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <h3 className="font-serif text-xl text-white font-bold">Inbound Calendar Subscriptions</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Synchronize availability from Airbnb, MakeMyTrip, Booking.com, and Agoda to automatically block reserved nights.
                </p>
              </div>

              <button
                onClick={() => setShowAddChannelModal(true)}
                className="px-4 py-2.5 bg-accent-gold hover:bg-white text-black font-bold text-xs font-mono uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Inbound Channel
              </button>
            </div>

            {/* Outbound iCal Feeds */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <span className="text-xs font-mono uppercase text-accent-gold font-bold block">
                Outbound iCal Export URL (Provide this to Airbnb / MMT)
              </span>
              <p className="text-xs text-zinc-400">
                Copy this URL and paste it into Airbnb / MMT under <em>Export Calendar</em>. Cancelled and abandoned bookings are automatically omitted so your OTA dates stay unblocked.
              </p>
              {spaces.map((sp) => {
                const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nothingness.asia';
                const icalUrl = `${origin}/api/spaces/${sp.slug}/calendar.ics`;

                return (
                  <div key={sp.id} className="flex items-center gap-2 pt-1 font-mono text-xs">
                    <span className="text-zinc-300 shrink-0 font-bold">{sp.title}:</span>
                    <input
                      type="text"
                      readOnly
                      value={icalUrl}
                      className="flex-1 bg-black/50 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-400 text-xs truncate select-all"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(icalUrl);
                        setCopiedSlug(sp.slug);
                        toast.success('iCal export URL copied to clipboard!');
                        setTimeout(() => setCopiedSlug(null), 2000);
                      }}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSlug === sp.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSlug === sp.slug ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Connected Feeds List */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider block font-bold">
                Connected External Feeds ({filteredSyncSources.length})
              </span>
              <div className="grid grid-cols-1 gap-3">
                {filteredSyncSources.map((source) => (
                  <div key={source.id} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono uppercase">{source.platform}</span>
                        <span className="text-xs text-zinc-400 font-mono">• {source.spaces?.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                          source.sync_status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          source.sync_status === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {source.sync_status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-500 truncate max-w-md mt-1">{source.inbound_ical_url}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (!confirm('Remove this calendar sync channel?')) return;
                          try {
                            const res = await fetch(`/api/admin/calendar-sync/status?id=${source.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              toast.success('Channel removed');
                              setSyncSources(prev => prev.filter(s => s.id !== source.id));
                            }
                          } catch (_) {}
                        }}
                        className="p-2 rounded-lg bg-zinc-900 text-zinc-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredSyncSources.length === 0 && (
                  <div className="p-8 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-2xl">
                    No inbound sync channels configured for this space. Click "Add Inbound Channel" above to connect Airbnb or MMT.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE BOOKING DOSSIER & MANAGEMENT MODAL                            */}
      {/* ========================================================================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header & Status */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-mono font-bold">
                  Reservation Dossier
                </span>

                <span className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-mono font-bold border ${
                  selectedBooking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  selectedBooking.status === 'checked_in' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                  selectedBooking.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                  isBookingAbandoned(selectedBooking) ? 'bg-zinc-900 text-zinc-400 border-zinc-700' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {isBookingAbandoned(selectedBooking) ? 'Abandoned (Unpaid)' : selectedBooking.status}
                </span>

                {isBookingIdVerified(selectedBooking) ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> ID Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Vetting Pending
                  </span>
                )}
              </div>

              <h2 className="font-serif text-2xl text-white font-bold">
                {selectedBooking.guest_name || 'Nothingness Guest'}
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {selectedBooking.spaces?.title} • ID: <span className="text-zinc-200 select-all">{selectedBooking.id}</span>
              </p>
            </div>

            {/* Abandoned Notice Banner */}
            {isBookingAbandoned(selectedBooking) && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-1 font-mono">
                <p className="font-bold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4" /> Abandoned Checkout Detected
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  This reservation was created during checkout but left unpaid. Dates have been automatically released so real guests can book on Airbnb, MMT, and your website. You can confirm it manually if paid in cash, or delete it permanently.
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5 text-xs text-zinc-300 font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Check-in:</span>
                <span className="text-white font-bold">{selectedBooking.check_in.split('T')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Check-out:</span>
                <span className="text-white font-bold">{selectedBooking.check_out.split('T')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Tariff:</span>
                <span className="text-accent-gold font-bold">₹{Number(selectedBooking.total_price || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Payment Status:</span>
                <span className={`font-bold uppercase ${
                  selectedBooking.payment_status === 'completed' || selectedBooking.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {selectedBooking.payment_status || 'Pending'} ({selectedBooking.payment_method || 'UPI'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Phone:</span>
                <span className="text-white select-all">{selectedBooking.guest_phone || 'None provided'}</span>
              </div>
              {selectedBooking.guest_email && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Email:</span>
                  <span className="text-white select-all">{selectedBooking.guest_email}</span>
                </div>
              )}
            </div>

            {/* Multi-Guest Vetting Registry */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-zinc-400 font-bold block">
                Guest Verification Registry ({selectedBooking.booking_guests?.length || 1} Guests)
              </span>
              <div className="space-y-1.5">
                {selectedBooking.booking_guests && selectedBooking.booking_guests.length > 0 ? (
                  selectedBooking.booking_guests.map((g, idx) => {
                    const prof = g.guest_profiles;
                    const avatarImg = prof?.live_face_url || prof?.photo_url;
                    return (
                      <div key={g.id || idx} className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-zinc-700 shrink-0 flex items-center justify-center relative shadow-sm">
                            {avatarImg ? (
                              <img src={avatarImg} alt={g.name || 'Guest'} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-zinc-600" />
                            )}
                            {prof?.face_id_vetted && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black shadow-sm" title="3D Face ID Vetted" />
                            )}
                          </div>
                          <div className="min-w-0 truncate">
                            <p className="text-white font-bold truncate">{g.name || prof?.full_name || `Guest ${idx + 1}`}</p>
                            <p className="text-[10px] text-zinc-400">{g.phone || prof?.phone_number || 'No phone'}</p>
                            {prof?.document_number && (
                              <p className="text-[9px] text-accent-gold mt-0.5 truncate">Doc: {prof.document_number}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-1">
                            {prof?.face_id_vetted && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                                3D Face ID ✓
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                              g.verification_status === 'verified' || prof?.is_verified
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              {g.verification_status === 'verified' || prof?.is_verified ? 'Verified ✅' : 'Pending 🟡'}
                            </span>
                          </div>
                          {prof?.id && (
                            <Link
                              href={`/admin/guests/${prof.id}`}
                              target="_blank"
                              className="text-[10px] text-accent-gold hover:underline flex items-center gap-1"
                            >
                              <span>View ID &amp; Dossier</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs font-mono text-zinc-500">
                    No additional guest records registered yet.
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp Digital Vetting Dispatch */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => shareVerificationWhatsApp(selectedBooking)}
                className="w-full py-3 bg-accent-gold/15 hover:bg-accent-gold/25 border border-accent-gold/30 text-accent-gold rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Share WhatsApp ID Verification Link
              </button>

              {selectedBooking.guest_phone && (
                <button
                  onClick={() => openWhatsAppChat(
                    selectedBooking.guest_phone!,
                    selectedBooking.guest_name || 'Guest',
                    selectedBooking.spaces?.title || ''
                  )}
                  className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> Direct WhatsApp Chat
                </button>
              )}
            </div>

            {/* Status & Action Buttons */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => startEditBooking(selectedBooking)}
                  className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Details
                </button>

                {selectedBooking.status !== 'confirmed' && (
                  <button
                    onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'confirmed')}
                    disabled={actionLoadingId === selectedBooking.id}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Confirm &amp; Paid
                  </button>
                )}

                {selectedBooking.status !== 'checked_in' && (
                  <button
                    onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'checked_in')}
                    disabled={actionLoadingId === selectedBooking.id}
                    className="py-2.5 px-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Check-In
                  </button>
                )}

                {selectedBooking.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'cancelled')}
                    disabled={actionLoadingId === selectedBooking.id}
                    className="py-2.5 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel Stay
                  </button>
                )}

                <button
                  onClick={() => handleDeleteBooking(selectedBooking.id)}
                  disabled={actionLoadingId === selectedBooking.id}
                  className="py-2.5 px-3 bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT BOOKING MODAL                                                        */}
      {/* ========================================================================= */}
      {isEditingBooking && selectedBooking && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsEditingBooking(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-serif text-xl text-white font-bold">Edit Reservation Details</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Modify dates, guest info, tariff, or payment status.
              </p>
            </div>

            <form onSubmit={handleSaveBookingEdit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={editFormData.check_in}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, check_in: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Check-out Date</label>
                  <input
                    type="date"
                    required
                    value={editFormData.check_out}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, check_out: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Primary Guest Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.guest_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, guest_name: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Guest Phone</label>
                  <input
                    type="text"
                    value={editFormData.guest_phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, guest_phone: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Total Tariff (₹)</label>
                  <input
                    type="number"
                    value={editFormData.total_price}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, total_price: Number(e.target.value) }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Payment Method</label>
                  <select
                    value={editFormData.payment_method}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="OTA">OTA / Airbnb / MMT</option>
                    <option value="Card">Card</option>
                    <option value="PayU">PayU Gateway</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Reservation Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="checked_in">Checked In</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-3 bg-accent-gold hover:bg-white text-black font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Reservation Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBooking(false)}
                  className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BLOCKED DATE MODAL                                                        */}
      {/* ========================================================================= */}
      {selectedBlockedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedBlockedDate(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] uppercase font-mono font-bold">
                Blocked Date Record
              </span>
              <h2 className="font-serif text-2xl text-white font-bold mt-2">
                {selectedBlockedDate.summary || 'Blocked Dates'}
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {selectedBlockedDate.spaces?.title}
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-2.5 text-xs text-zinc-300 font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">From:</span>
                <span className="text-white font-bold">{selectedBlockedDate.start_date.split('T')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">To:</span>
                <span className="text-white font-bold">{selectedBlockedDate.end_date.split('T')[0]}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleDeleteBlockedDate(selectedBlockedDate.id)}
                className="flex-1 py-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Unblock Dates
              </button>
              <button
                onClick={() => setSelectedBlockedDate(null)}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-mono uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK ACTION / BLOCK DATES MODAL                                          */}
      {/* ========================================================================= */}
      {showQuickActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowQuickActionModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800 font-mono text-xs">
              <button
                onClick={() => setQuickActionTab('block')}
                className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  quickActionTab === 'block' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Block Dates
              </button>
              <button
                onClick={() => setQuickActionTab('booking')}
                className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  quickActionTab === 'booking' ? 'bg-accent-gold text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Quick Reservation
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Select Sanctuary</label>
                <select
                  value={quickSpaceId}
                  onChange={(e) => setQuickSpaceId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                >
                  {spaces.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={quickStartDate}
                    onChange={(e) => setQuickStartDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={quickEndDate}
                    onChange={(e) => setQuickEndDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {quickActionTab === 'block' ? (
                <div>
                  <label className="text-zinc-400 block mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    required
                    value={quickSummary}
                    onChange={(e) => setQuickSummary(e.target.value)}
                    placeholder="e.g. Deep Cleaning / Private Event"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-zinc-400 block mb-1">Guest Name</label>
                    <input
                      type="text"
                      required
                      value={quickGuestName}
                      onChange={(e) => setQuickGuestName(e.target.value)}
                      placeholder="e.g. Dev Malhotra"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">Guest Phone</label>
                      <input
                        type="text"
                        required
                        value={quickGuestPhone}
                        onChange={(e) => setQuickGuestPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Total Tariff (₹)</label>
                      <input
                        type="number"
                        required
                        value={quickTotalPrice}
                        onChange={(e) => setQuickTotalPrice(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={quickSubmitting}
                className="w-full py-3 bg-accent-gold hover:bg-white text-black font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {quickSubmitting ? 'Saving...' : quickActionTab === 'block' ? 'Block Selected Dates' : 'Confirm Reservation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD INBOUND CHANNEL MODAL                                                 */}
      {/* ========================================================================= */}
      {showAddChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowAddChannelModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-serif text-xl text-white font-bold">Add Inbound iCal Feed</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Paste the calendar export URL from Airbnb, MakeMyTrip, or Booking.com.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setChannelSubmitting(true);
                try {
                  const res = await fetch('/api/admin/calendar-sync/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      space_id: selectedSpaceForChannel,
                      platform: newPlatform,
                      inbound_ical_url: newIcalUrl.trim()
                    })
                  });
                  const data = await res.json();
                  if (res.ok && data.success) {
                    toast.success('Channel added and sync initiated!');
                    setSyncSources(prev => [...prev, data.source]);
                    setShowAddChannelModal(false);
                    setNewIcalUrl('');
                    handleSyncAll(true);
                  } else {
                    toast.error(data.error || 'Failed to add channel');
                  }
                } catch {
                  toast.error('Error adding channel');
                } finally {
                  setChannelSubmitting(false);
                }
              }}
              className="space-y-4 font-mono text-xs"
            >
              <div>
                <label className="text-zinc-400 block mb-1">Sanctuary</label>
                <select
                  value={selectedSpaceForChannel}
                  onChange={(e) => setSelectedSpaceForChannel(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                >
                  {spaces.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Platform</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="airbnb">Airbnb</option>
                  <option value="makemytrip">MakeMyTrip (InGo-MMT)</option>
                  <option value="booking.com">Booking.com</option>
                  <option value="agoda">Agoda</option>
                  <option value="other">Other iCal Feed</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Inbound iCal URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  value={newIcalUrl}
                  onChange={(e) => setNewIcalUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={channelSubmitting}
                className="w-full py-3 bg-accent-gold hover:bg-white text-black font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {channelSubmitting ? 'Connecting...' : 'Connect & Sync Feed'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
