'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, 
  Sparkles, 
  Search, 
  Plus, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  Globe, 
  UserCheck, 
  Flame,
  ChevronRight,
  RefreshCw,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { isUserAdmin } from '@/lib/auth-utils';
import LocationSelectorModal from '@/components/kinkster/LocationSelectorModal';

interface GroupItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  rules?: string;
  category: string;
  visibility: 'public' | 'private' | 'invite_only' | 'approval_required';
  avatar_url?: string;
  cover_url?: string;
  members_count: number;
  active_events_count: number;
  user_membership?: {
    role: string;
    status: string;
  } | null;
  kinkster_profiles?: {
    id: string;
    alias: string;
    avatar_url?: string;
  };
}

function KinksterGroupsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMine, setFilterMine] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [currentLocationName, setCurrentLocationName] = useState<string>('Delhi NCR');

  // Create Group Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupCategory, setNewGroupCategory] = useState<string>('Rope & Shibari');
  const [newGroupVisibility, setNewGroupVisibility] = useState<'public' | 'approval_required' | 'private'>('public');
  const [newGroupDescription, setNewGroupDescription] = useState<string>('');
  const [newGroupRules, setNewGroupRules] = useState<string>('');
  const [creatingGroup, setCreatingGroup] = useState<boolean>(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      let url = '/api/kinkster/groups?';
      if (selectedCategory !== 'all') {
        url += `category=${encodeURIComponent(selectedCategory)}&`;
      }
      if (searchQuery.trim()) {
        url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      }
      if (filterMine) {
        url += 'mine=true&';
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user || null);
      if (user) {
        setIsAdmin(isUserAdmin(user));
      }
    });

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
    const createParam = searchParams?.get('create');
    if (createParam === 'true') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchGroups();
  }, [selectedCategory, filterMine]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGroups();
  };

  const handleJoinGroup = async (group: GroupItem) => {
    try {
      const res = await fetch(`/api/kinkster/groups/${group.slug}/members`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join community.');

      if (data.status === 'active') {
        toast.success(`Joined ${group.name}! ✨`, {
          description: 'You are now an active member of this community.',
        });
      } else {
        toast.info('Request Submitted for Review', {
          description: 'Community organizers will verify your vetting before admission.',
        });
      }

      fetchGroups();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Community name is required.');
      return;
    }
    if (!newGroupDescription.trim()) {
      toast.error('Community description is required.');
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await fetch('/api/kinkster/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          category: newGroupCategory,
          visibility: newGroupVisibility,
          description: newGroupDescription.trim(),
          rules: newGroupRules.trim() || 'Respect consent and sovereign member discretion.',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create community.');

      toast.success(`Community "${newGroupName}" Created! ✨`);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupRules('');
      router.push(`/the-circle/groups/${data.group.slug}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create community.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Communities' },
    { id: 'Rope & Shibari', label: 'Rope & Shibari' },
    { id: 'Sensory & Mindful', label: 'Sensory & Mindful' },
    { id: 'Power Dynamics & BDSM', label: 'Power Dynamics & BDSM' },
    { id: 'Leather, Rubber & Gear', label: 'Leather, Rubber & Gear' },
    { id: 'Aesthetics, Noir & Dark Romance', label: 'Noir & Aesthetics' },
    { id: 'Fetish & Specific Desires', label: 'Fetish & Desires' },
    { id: 'Couples, Polyamory & Non-Monogamy', label: 'Couples & Non-Monogamy' },
    { id: 'Social, Salons & Munch Circles', label: 'Social & Salons' },
    { id: 'Wellness, Healing & Integration', label: 'Wellness & Integration' },
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-24 sm:pt-28 pb-28 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-zinc-900 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest mb-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Sovereign Communities &amp; Circles</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif bg-gradient-to-r from-purple-200 via-rose-300 to-amber-300 bg-clip-text text-transparent">
            Communities
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Persistent sanctuary communities across 50 canonical practices and desires. Join circles, discover curated gatherings, and share reflections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Location Relevance Control Button */}
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 hover:text-amber-200 font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Calibrate discovery location"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentLocationName}</span>
          </button>

          {/* Form Community - strictly restricted to admins */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Form Community</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-4 mb-8">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search communities by name or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 font-mono transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-mono transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Categories & Filter Toggle */}
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950/90 border border-zinc-900 rounded-2xl backdrop-blur-xl w-max">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFilterMine(!filterMine)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
              filterMine
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            {filterMine ? 'My Communities ✓' : 'My Communities'}
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="py-24 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
          <span>Discovering sanctuary communities...</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 bg-zinc-950 border border-zinc-900 rounded-3xl p-8 space-y-3">
          <Users className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white font-mono">No Communities Found</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {searchQuery
              ? `No communities matching "${searchQuery}". Try a different keyword.`
              : 'Be the first vetted member to form a community in this category!'}
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono transition-all inline-block mt-2 cursor-pointer"
          >
            Form First Community
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => {
            const isMember = group.user_membership?.status === 'active';
            const isPending = group.user_membership?.status === 'pending';
            const isOwner = group.user_membership?.role === 'owner';

            const displayCover = group.cover_url || 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200';
            const displayAvatar = group.avatar_url || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400';

            return (
              <div
                key={group.id}
                className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl transition-all flex flex-col group"
              >
                {/* Community Cover Banner */}
                <div className="relative h-36 shrink-0 overflow-hidden bg-zinc-900">
                  <img
                    src={displayCover}
                    alt={group.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                  {/* Category & Visibility Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-purple-300 text-[10px] font-mono font-bold">
                      {group.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-300 text-[10px] font-mono flex items-center gap-1">
                      {group.visibility === 'public' ? (
                        <>
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span>Public</span>
                        </>
                      ) : group.visibility === 'approval_required' ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-amber-400" />
                          <span>Vetted</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-rose-400" />
                          <span>Private</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Avatar Overlay */}
                  <div className="absolute -bottom-4 left-5">
                    <img
                      src={displayAvatar}
                      alt={group.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-950 shadow-xl"
                    />
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 sm:p-6 pt-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/the-circle/groups/${group.slug}`}
                        className="text-lg font-bold text-white font-serif hover:text-purple-300 transition-colors leading-snug"
                      >
                        {group.name}
                      </Link>

                      {isOwner && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-mono font-bold shrink-0">
                          Owner 👑
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>

                    {/* Metadata Stats */}
                    <div className="flex items-center gap-4 pt-1 text-[11px] font-mono text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span>{group.members_count || 1} members</span>
                      </div>

                      {group.active_events_count > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{group.active_events_count} soirée{group.active_events_count > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-4 border-t border-zinc-900 flex items-center justify-between gap-3">
                    <Link
                      href={`/the-circle/groups/${group.slug}`}
                      className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>Explore Circle</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {isMember ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Member</span>
                      </div>
                    ) : isPending ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                        <span>Pending Approval</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleJoinGroup(group)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs font-mono transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        {group.visibility === 'approval_required' ? 'Request Access' : 'Join Circle'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl animate-fadeIn">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-serif">Form a Sanctuary Community</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">Create an ongoing circle for vetted discussions &amp; gatherings</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-300 mb-1 font-bold">Community Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shibari & Kinetic Aesthetics"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-bold">Category</label>
                  <select
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Shibari & Rope">Shibari &amp; Rope</option>
                    <option value="Noir & Aesthetics">Noir &amp; Aesthetics</option>
                    <option value="Sensory & Mindful">Sensory &amp; Mindful</option>
                    <option value="Social & Salons">Social &amp; Salons</option>
                    <option value="Power Dynamics">Power Dynamics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1 font-bold">Visibility &amp; Entry</label>
                  <select
                    value={newGroupVisibility}
                    onChange={(e) => setNewGroupVisibility(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="public">Public (Any Vetted Member)</option>
                    <option value="approval_required">Approval Required (Organizer Vetted)</option>
                    <option value="private">Private (Invite-Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-bold">Description &amp; Intention</label>
                <textarea
                  rows={3}
                  placeholder="What is this circle about? What dialogues, rituals, or gatherings will you host?"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-bold">Community Etiquette / Rules</label>
                <input
                  type="text"
                  placeholder="e.g. Consensual touch only. Sober presence required."
                  value={newGroupRules}
                  onChange={(e) => setNewGroupRules(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {creatingGroup ? 'Establishing Circle...' : 'Create Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Calibration Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationChanged={(newLoc) => {
          setCurrentLocationName(newLoc.city || 'Global');
          fetchGroups();
        }}
      />
    </div>
  );
}

export default function KinksterGroupsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
        Loading sanctuary groups...
      </div>
    }>
      <KinksterGroupsContent />
    </Suspense>
  );
}
