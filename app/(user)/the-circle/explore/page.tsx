'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Compass, 
  Sparkles, 
  Heart, 
  MessageSquare, 
  Flame, 
  Lock, 
  Calendar, 
  MapPin, 
  UserPlus, 
  UserCheck, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  Clock,
  ChevronRight,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import KinksterInboxDrawer from '@/components/kinkster/KinksterInboxDrawer';
import HealthBadgeModal, { HealthBadge } from '@/components/kinkster/HealthBadgeModal';
import HealthReportUploadModal from '@/components/kinkster/HealthReportUploadModal';
import DesireResonanceModal from '@/components/kinkster/DesireResonanceModal';
import EphemeralChatModal from '@/components/kinkster/EphemeralChatModal';
import LocationSelectorModal from '@/components/kinkster/LocationSelectorModal';

interface MatchedKinkster {
  id: string;
  alias: string;
  bio: string;
  avatar_url: string;
  interests: string[];
  kink_tags: string[];
  match_score: number;
  health_badges?: HealthBadge[];
  is_in_person_vetted?: boolean;
}

interface CommunityPreview {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  avatar_url?: string;
  members_count: number;
  active_events_count: number;
}

function KinksterExploreContent() {
  const [activeTab, setActiveTab] = useState<'members' | 'groups' | 'events' | 'dynamics'>('members');
  const [matches, setMatches] = useState<MatchedKinkster[]>([]);
  const [groups, setGroups] = useState<CommunityPreview[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [mutualMatches, setMutualMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [currentLocationName, setCurrentLocationName] = useState<string>('Delhi NCR');

  // Modals & Drawers
  const [selectedChatAlias, setSelectedChatAlias] = useState<string | null>(null);
  const [selectedHealthBadge, setSelectedHealthBadge] = useState<HealthBadge | null>(null);
  const [showHealthUploadModal, setShowHealthUploadModal] = useState<boolean>(false);
  const [resonanceTarget, setResonanceTarget] = useState<{ alias: string; avatar?: string } | null>(null);
  const [activeChamber, setActiveChamber] = useState<{ token: string; alias: string; avatar?: string } | null>(null);
  const [currentViewerAlias, setCurrentViewerAlias] = useState<string>('');

  const fetchDiscoveryData = async () => {
    setLoading(true);
    try {
      // 0. Fetch current profile
      fetch('/api/kinkster/profile')
        .then(r => r.json())
        .then(d => {
          if (d.profile?.alias) setCurrentViewerAlias(d.profile.alias);
        })
        .catch(() => {});

      // 1. Fetch compatibility matches
      const matchRes = await fetch('/api/kinkster/match');
      if (matchRes.ok) {
        const matchData = await matchRes.json();
        setMatches(matchData.matches || []);
      }

      // 2. Fetch communities preview
      const groupRes = await fetch('/api/kinkster/groups');
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        setGroups((groupData.groups || []).slice(0, 6));
      }

      // 3. Fetch events preview
      const eventRes = await fetch('/api/kinkster/events');
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvents((eventData.events || []).slice(0, 4));
      }

      // 4. Fetch mutual resonances (for active 48h mutual locks)
      const resRes = await fetch('/api/kinkster/resonance');
      if (resRes.ok) {
        const resData = await resRes.json();
        setMutualMatches(resData.mutualMatches || []);
      }
    } catch (err) {
      console.error('Failed to load explore data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryData();
    fetch('/api/kinkster/location')
      .then(r => r.json())
      .then(d => {
        if (d.currentLocation?.city) {
          const match = (d.supportedMetros || []).find((m: any) => m.city?.toLowerCase() === d.currentLocation.city?.toLowerCase());
          setCurrentLocationName(match?.name || d.currentLocation.city);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/kinkster/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Universal search error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendSpice = async (alias: string) => {
    try {
      const res = await fetch('/api/kinkster/spice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_alias: alias })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send spice');

      if (data.is_mutual) {
        toast.success(`Mutual Spice Match! 🔥`, {
          description: `You and @${alias} both sparked each other! Chat unlocked.`
        });
        setSelectedChatAlias(alias);
      } else {
        toast.success(`Spice dropped for @${alias}!`, {
          description: 'If they spark back, an encrypted chat thread will unlock.'
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed.');
    }
  };

  const dynamicTags = [
    { title: 'Roles & Dynamics', tags: ['Rigger', 'Rope Model', 'Dominant', 'Submissive', 'Switch', 'Sadist', 'Masochist', 'Primal Hunter', 'Primal Prey', 'Exhibitionist', 'Voyeur', 'Sensory Guide', 'Aftercare Anchor', 'Pet / Handler'] },
    { title: 'Orientation & Unit', tags: ['Single Female', 'Single Male', 'Non-Binary', 'MF Couple', 'FF Couple', 'Polyamorous Trio'] },
    { title: 'Desired Contexts', tags: ['Secret Munches & Salons', 'Noir Masquerades', 'Mindful Shibari Sessions', 'Sanctuary Suite Stays', 'Pure Platonic Dialogue'] },
  ];

  const filteredMatches = matches.filter((m) =>
    m.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.interests?.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
    m.kink_tags?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black text-white pt-24 sm:pt-28 pb-28 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-zinc-900 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-accent-gold uppercase tracking-widest mb-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Multi-Faceted Sanctuary Discovery</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif bg-gradient-to-r from-amber-200 via-rose-300 to-accent-gold bg-clip-text text-transparent">
            Explore Ecosystem
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Discover verified members, drop dual-blind desire resonance, browse specialized community circles, and preview upcoming secret gatherings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 hover:text-amber-200 text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Calibrate discovery location"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentLocationName}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowHealthUploadModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verify Health Badge</span>
          </button>
        </div>
      </div>

      {/* Mutual Match Gold Banners (48-Hour Locks) */}
      {mutualMatches.length > 0 && (
        <div className="space-y-3 mb-8">
          {mutualMatches.map((match) => (
            <div
              key={match.id}
              className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-rose-950/40 border border-amber-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={match.avatar_url || match.otherAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                    alt={match.alias || match.otherAlias || 'anonymous'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
                  />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-black text-[9px] font-bold">
                    ✓
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white font-mono">
                      Mutual Resonance Confirmed: @{match.alias || match.otherAlias}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                      48h Mutual Lock
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-400" /> Temporary encrypted chamber unlocked for 24 hours.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const token = match.chamber_token || match.chamberToken;
                  if (token) {
                    setActiveChamber({
                      token,
                      alias: match.alias || match.otherAlias || 'Sanctuary Member',
                      avatar: match.avatar_url || match.otherAvatar,
                    });
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-bold text-xs font-mono flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Enter Confidential Chamber</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Universal Search Input */}
      <div className="relative max-w-xl mb-8">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search people, communities, gatherings, topics across sanctuaries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-24 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-mono transition-colors shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 px-2.5 py-1 text-xs font-mono bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {searchQuery.trim().length > 0 ? (
        /* Universal Search Results View */
        <div className="space-y-8 animate-fadeIn">
          {searching ? (
            <div className="py-24 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Searching across all sanctuaries...</span>
            </div>
          ) : !searchResults || (
            (searchResults.people?.length || 0) === 0 &&
            (searchResults.communities?.length || 0) === 0 &&
            (searchResults.topics?.length || 0) === 0 &&
            (searchResults.events?.length || 0) === 0 &&
            (searchResults.posts?.length || 0) === 0
          ) ? (
            <div className="text-center py-20 bg-zinc-950 border border-zinc-900 rounded-3xl p-8 space-y-3">
              <Search className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white font-mono">No Sanctuary Content Found</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                No matching members, communities, gatherings, or topics found for &ldquo;{searchQuery}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Canonical Communities & Topics */}
              {((searchResults.communities?.length || 0) > 0 || (searchResults.topics?.length || 0) > 0) && (
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Communities &amp; Topics</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...(searchResults.communities || []), ...(searchResults.topics || [])].map((item: any) => (
                      <Link
                        key={item.id}
                        href={`/the-circle/groups/${item.slug}`}
                        className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-purple-500/40 transition-all flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors font-serif">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {item.category}
                          </div>
                        </div>
                        {item.geoTier && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-amber-300 capitalize shrink-0">
                            {item.geoTier}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified People */}
              {(searchResults.people?.length || 0) > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Verified Members</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchResults.people.map((person: any) => (
                      <Link
                        key={person.id}
                        href={`/the-circle/${person.alias}`}
                        className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-rose-500/40 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={person.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                            alt={person.alias}
                            className="w-11 h-11 rounded-xl object-cover border border-rose-500/30"
                          />
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-rose-300 font-mono">
                              @{person.alias}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {person.city ? `${person.city}, ${person.country}` : 'Sanctuary Member'}
                            </div>
                          </div>
                        </div>
                        {person.geoTier && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-amber-300 capitalize shrink-0">
                            {person.geoTier}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Events & Gatherings */}
              {(searchResults.events?.length || 0) > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Secret Gatherings</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchResults.events.map((evt: any) => (
                      <Link
                        key={evt.id}
                        href={`/the-circle/events?id=${evt.id}`}
                        className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-amber-500/40 transition-all flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-white group-hover:text-amber-300 font-serif">
                            {evt.title}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {evt.event_date ? new Date(evt.event_date).toLocaleDateString() : 'Secret Date'} • {evt.tier}
                          </div>
                        </div>
                        {evt.geoTier && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-amber-300 capitalize shrink-0">
                            {evt.geoTier}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts & Reflections */}
              {(searchResults.posts?.length || 0) > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Reflections</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchResults.posts.map((post: any) => (
                      <div
                        key={post.id}
                        className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                          <span>@{post.kinkster_profiles?.alias || 'member'}</span>
                          {post.geoTier && (
                            <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-amber-300 capitalize">
                              {post.geoTier}
                            </span>
                          )}
                        </div>
                        {post.caption && (
                          <p className="text-xs text-zinc-300 line-clamp-2">{post.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Discovery Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950/90 border border-zinc-900 rounded-2xl backdrop-blur-xl mb-8 overflow-x-auto no-scrollbar w-max max-w-full">
            {[
              { id: 'members', label: `Verified Members (${matches.length})`, icon: UserCheck },
              { id: 'groups', label: `Communities (${groups.length})`, icon: Users },
              { id: 'events', label: `Gatherings (${events.length})`, icon: Calendar },
              { id: 'dynamics', label: 'Lifestyle Dynamics', icon: Sparkles },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-accent-gold border border-accent-gold/40 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: MEMBERS & RESONANCE */}
          {activeTab === 'members' && (
            <div className="space-y-6">

          {loading ? (
            <div className="py-24 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Matching resonance with verified members...</span>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-20 bg-zinc-950 border border-zinc-900 rounded-3xl p-8 space-y-3">
              <UserCheck className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white font-mono">No Matching Members</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                No members found matching your search. Try another tag or check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMatches.map((member) => (
                <div
                  key={member.id}
                  className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all shadow-xl space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/the-circle/${member.alias}`}>
                          <img
                            src={member.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                            alt={member.alias}
                            className="w-14 h-14 rounded-2xl object-cover border border-rose-500/30 group-hover:scale-105 transition-transform"
                          />
                        </Link>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/the-circle/${member.alias}`}
                              className="text-sm font-bold text-white font-mono hover:text-rose-400 transition-colors"
                            >
                              @{member.alias}
                            </Link>
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            {member.is_in_person_vetted ? 'Level 2 In-Person Vetted ✓' : 'ID Vetted Member'}
                          </span>
                        </div>
                      </div>

                      {/* Compatibility Badge */}
                      <div className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold">
                        {member.match_score}% Resonance
                      </div>
                    </div>

                    {member.bio && (
                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-mono">
                        {member.bio}
                      </p>
                    )}

                    {/* Dynamic & Kink Tags */}
                    {member.kink_tags && member.kink_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {member.kink_tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dual Actions: Drop Resonance & Direct Whisper */}
                  <div className="pt-4 border-t border-zinc-900 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendSpice(member.alias)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span>Spark</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResonanceTarget({ alias: member.alias, avatar: member.avatar_url })}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      title="Confidential Intention Pairing"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Resonate (Dual-Blind)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMMUNITIES SPOTLIGHT */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-serif">Featured Community Circles</h3>
            <Link
              href="/the-circle/groups"
              className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>View All Groups</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/the-circle/groups/${group.slug}`}
                className="p-5 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all flex items-center justify-between gap-4 shadow-xl group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={group.avatar_url || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400'}
                    alt={group.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-purple-500/30 group-hover:scale-105 transition-transform shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white font-serif group-hover:text-purple-300 transition-colors truncate">
                      {group.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {group.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-zinc-500">
                      <span>{group.category}</span>
                      <span>•</span>
                      <span>{group.members_count || 1} members</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: UPCOMING GATHERINGS SPOTLIGHT */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-serif">Sanctuary Calendar Highlights</h3>
            <Link
              href="/the-circle/events"
              className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Full Calendar Vault</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-5 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase">
                      {event.tier}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white font-serif">
                    {event.title}
                  </h4>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <Link
                  href="/the-circle/events"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-300 hover:text-white transition-colors self-start"
                >
                  <span>Gathering Dossier &amp; Vetting →</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LIFESTYLE DYNAMICS TAGS */}
      {activeTab === 'dynamics' && (
        <div className="space-y-8 max-w-3xl">
          {dynamicTags.map((cat) => (
            <div key={cat.title} className="space-y-3 bg-zinc-950 border border-zinc-900 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-gold" />
                {cat.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {cat.tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSearchQuery(t);
                      setActiveTab('members');
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-accent-gold/40 text-xs font-mono text-zinc-300 hover:text-accent-gold transition-all cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* Modals & Drawers */}
      {resonanceTarget && (
        <DesireResonanceModal
          isOpen={!!resonanceTarget}
          onClose={() => {
            setResonanceTarget(null);
            fetchDiscoveryData();
          }}
          targetAlias={resonanceTarget.alias}
          targetAvatar={resonanceTarget.avatar}
        />
      )}

      {activeChamber && (
        <EphemeralChatModal
          isOpen={!!activeChamber}
          onClose={() => {
            setActiveChamber(null);
            fetchDiscoveryData();
          }}
          chamberToken={activeChamber.token}
          targetAlias={activeChamber.alias}
          targetAvatar={activeChamber.avatar}
          currentViewerAlias={currentViewerAlias}
        />
      )}

      {selectedChatAlias && (
        <KinksterInboxDrawer
          isOpen={!!selectedChatAlias}
          onClose={() => setSelectedChatAlias(null)}
          targetAlias={selectedChatAlias}
        />
      )}

      {showHealthUploadModal && (
        <HealthReportUploadModal
          isOpen={showHealthUploadModal}
          onClose={() => setShowHealthUploadModal(false)}
          onSuccess={() => {
            setShowHealthUploadModal(false);
            fetchDiscoveryData();
          }}
        />
      )}

      {/* Location Calibration Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationChanged={(newLoc) => {
          setCurrentLocationName(newLoc.city || 'Global');
          fetchDiscoveryData();
        }}
      />
    </div>
  );
}

export default function KinksterExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
        Loading sanctuary explore...
      </div>
    }>
      <KinksterExploreContent />
    </Suspense>
  );
}
