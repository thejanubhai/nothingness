'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  Users, 
  CreditCard, 
  Bot, 
  QrCode, 
  Settings as SettingsIcon, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Send, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle,
  Flame,
  Search,
  RefreshCw,
  Eye,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEventsHub() {
  const [activeTab, setActiveTab] = useState<'overview' | 'editor' | 'curation' | 'scanner' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);

  // Data States
  const [events, setEvents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ one_time_pass_price: 1499, ai_vetting_enabled: true });
  const [spaces, setSpaces] = useState<any[]>([]);

  // Editor Form State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    tagline: '',
    description: '',
    tier: 'soiree',
    space_id: '',
    venue_notes: '',
    event_date: '',
    end_time: '',
    dress_code: 'Noir Luxury / Velvet & Leather / Masquerade',
    consent_marshall_name: 'Aria (Floor Lead)',
    price_couples: 3999,
    price_females: 1499,
    price_males: 4999,
    price_nonbinary: 1999,
    max_couples: 6,
    max_females: 4,
    max_males: 3,
    max_nonbinary: 2,
    secret_location_address: '',
    secret_location_coordinates: '28.5244,77.2066',
    secret_location_instructions: 'Discreet private elevator access. Whisper @alias at door.',
    location_revealed_hours_before: 3,
    status: 'published',
  });

  // Curation Desk States
  const [selectedCurationEventId, setSelectedCurationEventId] = useState<string>('');
  const [curationFilter, setCurationFilter] = useState<string>('all');

  // Scanner States
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [scannedResult, setScannedResult] = useState<any>(null);
  const [scanLoading, setScanLoading] = useState(false);

  // Settings / Broadcast States
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all_passholders');
  const [broadcasting, setBroadcasting] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
        setApplications(data.applications || []);
        setPasses(data.passes || []);
        if (data.settings) setSettings(data.settings);
        setSpaces(data.spaces || []);
        if (data.events?.length > 0 && !selectedCurationEventId) {
          setSelectedCurationEventId(data.events[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load admin events data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#scanner') setActiveTab('scanner');
      else if (hash === '#curation') setActiveTab('curation');
      else if (hash === '#editor') setActiveTab('editor');
    }
  }, []);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventForm,
          id: editingEventId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save event');

      toast.success(editingEventId ? 'Gathering updated!' : 'New gathering published!');
      fetchAdminData();
      setActiveTab('overview');
      setEditingEventId(null);
    } catch (err: any) {
      toast.error('Error saving gathering', { description: err.message });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gathering?')) return;
    try {
      const res = await fetch('/api/admin/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Gathering deleted');
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateAppStatus = async (applicationId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/events/curation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status update failed');

      toast.success(`Application updated to ${newStatus.toUpperCase()}`);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleVerifyQR = async (tokenPayload: string, action: 'verify' | 'check_in' = 'verify') => {
    setScanLoading(true);
    try {
      let appId = '';
      let token = '';

      try {
        const parsed = JSON.parse(tokenPayload);
        appId = parsed.appId;
        token = parsed.token;
      } catch (e) {
        // Assume format appId:token
        const parts = tokenPayload.split(':');
        appId = parts[0]?.trim();
        token = parts[1]?.trim() || parts[0]?.trim();
      }

      const res = await fetch('/api/admin/events/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, token, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setScannedResult(data);
      if (action === 'check_in') {
        toast.success('Guest Checked-In Successfully!');
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error('QR Scan Error', { description: err.message });
      setScannedResult(null);
    } finally {
      setScanLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/events/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          settings,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');
      toast.success('Sanctuary Pass Settings Saved!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;
    setBroadcasting(true);
    try {
      const res = await fetch('/api/admin/events/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast_push',
          broadcast: {
            title: broadcastTitle,
            body: broadcastBody,
            targetGroup: broadcastTarget,
            eventId: selectedCurationEventId,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Broadcast failed');
      toast.success(`Dispatched to ${data.broadcastSentCount} active devices!`);
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBroadcasting(false);
    }
  };

  // Calculations for Overview Tab
  const totalPassRevenue = passes.reduce((acc, p) => acc + (p.amount_paid || 0), 0);
  const totalTicketRevenue = applications
    .filter((a) => a.status === 'confirmed' || a.status === 'checked_in')
    .reduce((acc, a) => acc + (a.ticket_price_paid || 0), 0);
  const totalGrossRevenue = totalPassRevenue + totalTicketRevenue;

  const currentCurationEvent = events.find((e) => e.id === selectedCurationEventId);
  const eventApps = applications.filter((a) => a.event_id === selectedCurationEventId);
  const filteredCurationApps = eventApps.filter((a) => {
    if (curationFilter === 'all') return true;
    return a.status === curationFilter;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 font-mono mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-white font-bold tracking-tight">
            Sanctuary Gatherings &amp; Events Engine
          </h1>
          <p className="text-xs text-white/40 mt-1">
            Autonomous ratio balancing, Gemini AI vetting, dynamic QR gatekeeper, and PayU lifecycle controls.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingEventId(null);
              setEventForm({
                title: '',
                tagline: '',
                description: '',
                tier: 'soiree',
                space_id: '',
                venue_notes: '',
                event_date: '',
                end_time: '',
                dress_code: 'Noir Luxury / Velvet & Leather / Masquerade',
                consent_marshall_name: 'Aria (Floor Lead)',
                price_couples: 3999,
                price_females: 1499,
                price_males: 4999,
                price_nonbinary: 1999,
                max_couples: 6,
                max_females: 4,
                max_males: 3,
                max_nonbinary: 2,
                secret_location_address: '',
                secret_location_coordinates: '28.5244,77.2066',
                secret_location_instructions: 'Discreet private elevator access.',
                location_revealed_hours_before: 3,
                status: 'published',
              });
              setActiveTab('editor');
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Gathering</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3">
        {[
          { id: 'overview', label: 'Overview & Metrics', icon: Calendar },
          { id: 'editor', label: editingEventId ? 'Edit Gathering' : 'Gathering Designer', icon: Edit3 },
          { id: 'curation', label: `Curation & AI Queue (${applications.filter(a => a.status === 'applied' || a.status === 'waitlisted').length})`, icon: Bot },
          { id: 'scanner', label: 'Gatekeeper QR Scanner', icon: QrCode },
          { id: 'settings', label: 'Pass & Engine Settings', icon: SettingsIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-lg'
                : 'text-white/50 hover:text-white bg-white/[0.02] border border-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & METRICS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Gross Events Revenue</span>
              <p className="text-2xl font-bold font-mono text-emerald-400">₹{totalGrossRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-white/40">Passes: ₹{totalPassRevenue.toLocaleString()} • Tickets: ₹{totalTicketRevenue.toLocaleString()}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Active Passholders</span>
              <p className="text-2xl font-bold font-mono text-amber-400">{passes.length}</p>
              <p className="text-[10px] text-white/40">Lifetime Sanctuary Members</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Published Gatherings</span>
              <p className="text-2xl font-bold font-mono text-purple-400">{events.length}</p>
              <p className="text-[10px] text-white/40">Munches, Raves &amp; Soirées</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Confirmed Attendees</span>
              <p className="text-2xl font-bold font-mono text-rose-400">
                {applications.filter((a) => a.status === 'confirmed' || a.status === 'checked_in').length}
              </p>
              <p className="text-[10px] text-white/40">Across all scheduled dates</p>
            </div>
          </div>

          {/* Gatherings List */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">All Scheduled Gatherings</h3>
            {events.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-2xl p-6">
                <p className="text-xs text-white/40">No gatherings published yet. Click "New Gathering" to create one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.map((evt) => {
                  const evApps = applications.filter((a) => a.event_id === evt.id);
                  const confirmedCount = evApps.filter((a) => a.status === 'confirmed' || a.status === 'checked_in').length;

                  return (
                    <div
                      key={evt.id}
                      className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono uppercase font-bold">
                            {evt.tier}
                          </span>
                          <span className="text-[11px] font-mono text-white/50">
                            {new Date(evt.event_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white">{evt.title}</h4>
                        <p className="text-xs text-white/50 line-clamp-2">{evt.description}</p>
                        
                        <div className="flex items-center gap-3 text-[11px] font-mono text-white/40 pt-1">
                          <span>Venue: <strong className="text-white">{evt.spaces?.title || 'Sanctuary'}</strong></span>
                          <span>•</span>
                          <span>Confirmed: <strong className="text-emerald-400">{confirmedCount}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => {
                            setSelectedCurationEventId(evt.id);
                            setActiveTab('curation');
                          }}
                          className="flex-1 py-2 bg-white/5 hover:bg-amber-500/20 text-amber-300 font-bold text-[11px] rounded-lg transition-colors"
                        >
                          Curation ({evApps.length})
                        </button>
                        <button
                          onClick={() => {
                            setEditingEventId(evt.id);
                            setEventForm({
                              title: evt.title,
                              tagline: evt.tagline || '',
                              description: evt.description,
                              tier: evt.tier,
                              space_id: evt.space_id || '',
                              venue_notes: evt.venue_notes || '',
                              event_date: evt.event_date ? new Date(evt.event_date).toISOString().slice(0, 16) : '',
                              end_time: evt.end_time ? new Date(evt.end_time).toISOString().slice(0, 16) : '',
                              dress_code: evt.dress_code || 'Noir Luxury',
                              consent_marshall_name: evt.consent_marshall_name || 'Aria',
                              price_couples: evt.price_couples || 3999,
                              price_females: evt.price_females || 1499,
                              price_males: evt.price_males || 4999,
                              price_nonbinary: evt.price_nonbinary || 1999,
                              max_couples: evt.max_couples || 6,
                              max_females: evt.max_females || 4,
                              max_males: evt.max_males || 3,
                              max_nonbinary: evt.max_nonbinary || 2,
                              secret_location_address: evt.secret_location_address || '',
                              secret_location_coordinates: evt.secret_location_coordinates || '',
                              secret_location_instructions: evt.secret_location_instructions || '',
                              location_revealed_hours_before: evt.location_revealed_hours_before || 3,
                              status: evt.status || 'published',
                            });
                            setActiveTab('editor');
                          }}
                          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                          title="Edit Gathering"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          title="Delete Gathering"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: GATHERING DESIGNER / EDITOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSaveEvent} className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6 max-w-3xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white">
              {editingEventId ? 'Edit Sanctuary Gathering' : 'Publish New Sanctuary Gathering'}
            </h3>
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Admin Only</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-white/70">Gathering Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Midnight Velvet Masquerade"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/70">Aesthetic Tagline</label>
              <input
                type="text"
                placeholder="e.g. A multi-sensory noir celebration"
                value={eventForm.tagline}
                onChange={(e) => setEventForm({ ...eventForm, tagline: e.target.value })}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/70">Gathering Tier</label>
              <select
                value={eventForm.tier}
                onChange={(e) => setEventForm({ ...eventForm, tier: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
              >
                <option value="munch">Tier 1: Sanctuary Salon &amp; Munch (Social/Discussion)</option>
                <option value="rave">Tier 2: Noir Masquerade &amp; Sensory Rave</option>
                <option value="soiree">Tier 3: Intimate Sanctuary Soirée (Autonomous Play)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-white/70">Description &amp; Vibe Guidelines</label>
              <textarea
                rows={3}
                placeholder="Describe the atmosphere, sensory expectations, and floor rules..."
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/70">Host Sanctuary Space</label>
              <select
                value={eventForm.space_id}
                onChange={(e) => setEventForm({ ...eventForm, space_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
              >
                <option value="">Select Nothingness Sanctuary (Optional)</option>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/70">Floor Consent Marshall Name</label>
              <input
                type="text"
                value={eventForm.consent_marshall_name}
                onChange={(e) => setEventForm({ ...eventForm, consent_marshall_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/70">Event Start Date &amp; Time *</label>
              <input
                type="datetime-local"
                required
                value={eventForm.event_date}
                onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/70">Dress Code</label>
              <input
                type="text"
                value={eventForm.dress_code}
                onChange={(e) => setEventForm({ ...eventForm, dress_code: e.target.value })}
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Pricing & Ratio Quotas */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">Category Pricing &amp; Ratio Quotas</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-white/60">Couples Price (₹)</label>
                <input
                  type="number"
                  value={eventForm.price_couples}
                  onChange={(e) => setEventForm({ ...eventForm, price_couples: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/60">Max Couples</label>
                <input
                  type="number"
                  value={eventForm.max_couples}
                  onChange={(e) => setEventForm({ ...eventForm, max_couples: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/60">Female Price (₹)</label>
                <input
                  type="number"
                  value={eventForm.price_females}
                  onChange={(e) => setEventForm({ ...eventForm, price_females: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/60">Max Females</label>
                <input
                  type="number"
                  value={eventForm.max_females}
                  onChange={(e) => setEventForm({ ...eventForm, max_females: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/60">Single Male Price (₹)</label>
                <input
                  type="number"
                  value={eventForm.price_males}
                  onChange={(e) => setEventForm({ ...eventForm, price_males: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/60">Max Males (Capped)</label>
                <input
                  type="number"
                  value={eventForm.max_males}
                  onChange={(e) => setEventForm({ ...eventForm, max_males: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/60">Non-Binary Price (₹)</label>
                <input
                  type="number"
                  value={eventForm.price_nonbinary}
                  onChange={(e) => setEventForm({ ...eventForm, price_nonbinary: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/60">Max Non-Binary</label>
                <input
                  type="number"
                  value={eventForm.max_nonbinary}
                  onChange={(e) => setEventForm({ ...eventForm, max_nonbinary: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Secret Location Settings */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">Secret Location &amp; Gatekeeper Dispatch</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] text-white/60">Secret Address (Revealed on Timer)</label>
                <input
                  type="text"
                  placeholder="e.g. Penthouse 14B, DLF Horizon Tower / Farmhouse 12 Chattarpur"
                  value={eventForm.secret_location_address}
                  onChange={(e) => setEventForm({ ...eventForm, secret_location_address: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/60">GPS Coordinates (lat,lng)</label>
                <input
                  type="text"
                  value={eventForm.secret_location_coordinates}
                  onChange={(e) => setEventForm({ ...eventForm, secret_location_coordinates: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/60">Reveal Hours Prior</label>
                <input
                  type="number"
                  value={eventForm.location_revealed_hours_before}
                  onChange={(e) => setEventForm({ ...eventForm, location_revealed_hours_before: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-6 py-3 bg-white/5 text-white/60 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              {editingEventId ? 'Update Gathering' : 'Publish Gathering'}
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: CURATION & AI WAITLIST DESK */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'curation' && (
        <div className="space-y-6">
          {/* Gathering Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-white/40">Select Gathering to Curate</label>
              <select
                value={selectedCurationEventId}
                onChange={(e) => setSelectedCurationEventId(e.target.value)}
                className="px-4 py-2 bg-black border border-white/10 rounded-xl text-white text-xs font-bold focus:border-amber-500 outline-none"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({new Date(e.event_date).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Status Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Applicants' },
                { id: 'applied', label: 'Applied' },
                { id: 'waitlisted', label: 'Waitlisted' },
                { id: 'approved_payment_pending', label: 'Approved (Pending Pay)' },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'checked_in', label: 'Checked In' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCurationFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all ${
                    curationFilter === f.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                      : 'text-white/40 hover:text-white bg-white/[0.02]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Applicant Queue */}
          <div className="space-y-4">
            {filteredCurationApps.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-2xl p-6">
                <p className="text-xs text-white/40">No applicants found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredCurationApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">
                          Candidate ID: {app.user_id?.slice(0, 8)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/70 text-[10px] font-mono uppercase">
                          {app.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                          AI Trust Score: {app.ai_trust_score}/100
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          app.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          app.status === 'approved_payment_pending' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                          app.status === 'waitlisted' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {app.status.toUpperCase()}
                        </span>
                      </div>

                      {app.ai_evaluation_summary && (
                        <p className="text-xs text-white/60 italic bg-black/40 p-3 rounded-xl border border-white/5">
                          "{app.ai_evaluation_summary}"
                        </p>
                      )}

                      {app.payment_deadline && app.status === 'approved_payment_pending' && (
                        <p className="text-[10px] text-amber-400 font-mono">
                          Payment Deadline: {new Date(app.payment_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'approved_payment_pending')}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        Approve Pass
                      </button>
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'waitlisted')}
                        className="px-3 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-300 text-xs font-bold rounded-xl transition-all"
                      >
                        Waitlist
                      </button>
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'confirmed')}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        Force Confirm
                      </button>
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: GATEKEEPER LIVE QR SCANNER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'scanner' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">On-Ground Door Gatekeeper</h3>
                <p className="text-xs text-white/40">Scan or paste dynamic QR token for instant verification.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Paste Scanned QR JSON / Token Payload</label>
              <textarea
                rows={3}
                placeholder='e.g. {"appId":"...","token":"..."}'
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black border border-white/10 rounded-xl text-white font-mono text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleVerifyQR(manualTokenInput, 'verify')}
                disabled={scanLoading || !manualTokenInput}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all"
              >
                {scanLoading ? 'Inspecting...' : 'Verify Entry Pass'}
              </button>
              <button
                onClick={() => handleVerifyQR(manualTokenInput, 'check_in')}
                disabled={scanLoading || !manualTokenInput}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                Admit &amp; Mark Checked In
              </button>
            </div>
          </div>

          {/* Verification Result Card */}
          {scannedResult && (
            <div className="p-6 rounded-3xl bg-zinc-950 border border-emerald-500/40 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Verified Pass Record</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold">
                  {scannedResult.app?.status?.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>Event: <strong className="text-white">{scannedResult.app?.sanctuary_events?.title}</strong></div>
                <div>Category: <strong className="text-amber-400">{scannedResult.app?.category}</strong></div>
                <div>Aadhaar Verified: <strong className="text-emerald-400">{scannedResult.guestProfile?.is_verified ? 'YES' : 'NO'}</strong></div>
                <div>Alias: <strong className="text-purple-300">@{scannedResult.kinksterProfile?.alias || 'Guest'}</strong></div>
              </div>

              {scannedResult.isCheckedIn || scannedResult.checkedIn ? (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
                  ✓ GUEST ADMITTED &amp; CHECKED-IN
                </div>
              ) : (
                <button
                  onClick={() => handleVerifyQR(manualTokenInput, 'check_in')}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  Confirm Entry &amp; Mark Checked In →
                </button>
              )}

              {/* Physical In-Person Vetting Button for Munch */}
              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={async () => {
                    await handleVerifyQR(manualTokenInput, 'certify_physical_vetting' as any);
                    toast.success('In-Person Vetting Certified!', {
                      description: 'Guest now holds confidential access to Level 2 Masquerades & Private Soirées.',
                    });
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  <span>Discreetly Certify In-Person Vetting (Level 2 Unlock)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: PASS & ENGINE SETTINGS + EMERGENCY BROADCAST */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Settings Form */}
          <form onSubmit={handleUpdateSettings} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white">Sanctuary Pass Global Config</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">One-Time Sanctuary Pass Price (₹)</label>
              <input
                type="number"
                value={settings.one_time_pass_price}
                onChange={(e) => setSettings({ ...settings, one_time_pass_price: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-white font-mono text-xs"
              />
              <p className="text-[10px] text-white/40">Lifetime access fee charged to ID-verified guests to enter the Gatherings vault.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="ai_vetting"
                checked={settings.ai_vetting_enabled}
                onChange={(e) => setSettings({ ...settings, ai_vetting_enabled: e.target.checked })}
                className="w-4 h-4 rounded bg-black border-white/20 accent-amber-500"
              />
              <label htmlFor="ai_vetting" className="text-xs font-bold text-white">
                Enable Gemini AI Dynamic Concierge Vetting
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Save Engine Settings
            </button>
          </form>

          {/* Emergency Lockscreen Broadcast Tool */}
          <form onSubmit={handleSendBroadcast} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h3 className="text-base font-bold text-white">Discreet Push Broadcast Engine</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Target Audience</label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="w-full px-4 py-2 bg-black border border-white/10 rounded-xl text-white text-xs outline-none"
              >
                <option value="all_passholders">All Active Sanctuary Passholders</option>
                <option value="event_attendees">Confirmed Attendees of Selected Event</option>
                <option value="all_devices">All Subscribed Devices</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Broadcast Title</label>
              <input
                type="text"
                placeholder="e.g. Venue Coordinates Dispatched"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-4 py-2 bg-black border border-white/10 rounded-xl text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Message Body</label>
              <textarea
                rows={2}
                placeholder="Discreet lockscreen alert message..."
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                className="w-full px-4 py-2 bg-black border border-white/10 rounded-xl text-white text-xs"
                required
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{broadcasting ? 'Dispatching Broadcast...' : 'Dispatch Lockscreen Push'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
