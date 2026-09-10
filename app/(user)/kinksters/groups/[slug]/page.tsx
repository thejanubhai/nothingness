'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Users, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Globe, 
  ArrowLeft, 
  PlusCircle, 
  Heart, 
  MessageSquare, 
  Eye, 
  Share2, 
  Settings, 
  UserPlus, 
  UserMinus, 
  AlertCircle,
  Clock,
  MapPin,
  ChevronRight,
  RefreshCw,
  Camera,
  Flame
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import CreatePostModal from '@/components/kinkster/CreatePostModal';
import EventDossierModal from '@/components/events/EventDossierModal';
import EventConciergeModal from '@/components/events/EventConciergeModal';
import LiveTicketQRModal from '@/components/events/LiveTicketQRModal';

interface GroupDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  rules?: string;
  category: string;
  visibility: 'public' | 'private' | 'invite_only' | 'approval_required';
  avatar_url?: string;
  cover_url?: string;
  owner_id: string;
  members_count: number;
  user_membership?: {
    role: string;
    status: string;
  } | null;
  kinkster_profiles?: {
    id: string;
    alias: string;
    avatar_url?: string;
    bio?: string;
  };
  members?: Array<{
    id: string;
    alias: string;
    avatar_url?: string;
    role: string;
    status?: string;
    joined_at?: string;
    is_in_person_vetted?: boolean;
  }>;
  events?: any[];
  posts?: any[];
}

function GroupDetailContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'events' | 'members' | 'about'>('feed');
  const [locationName, setLocationName] = useState<string>('Delhi NCR');

  // Interactive Modals
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [selectedEventForDossier, setSelectedEventForDossier] = useState<any | null>(null);
  const [selectedEventForConcierge, setSelectedEventForConcierge] = useState<any | null>(null);
  const [selectedEventForTicket, setSelectedEventForTicket] = useState<{ event: any; app: any } | null>(null);

  const fetchGroup = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/kinkster/groups/${slug}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.isPrivate) {
          setGroup(data.group);
        } else {
          toast.error(data.error || 'Community not found.');
        }
        return;
      }
      setGroup(data.group);
      if (data.locationContext?.city) {
        setLocationName(data.locationContext.city);
      }
    } catch (err) {
      console.error('Failed to load group details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [slug]);

  const handleJoinOrLeave = async () => {
    if (!group) return;
    const isMember = group.user_membership?.status === 'active';

    try {
      if (isMember) {
        // Leave
        const res = await fetch(`/api/kinkster/groups/${slug}/members`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to leave community.');
        toast.info('You have left the community.');
      } else {
        // Join
        const res = await fetch(`/api/kinkster/groups/${slug}/members`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to join community.');

        if (data.status === 'active') {
          toast.success(`Welcome to ${group.name}! ✨`);
        } else {
          toast.info('Membership Request Submitted for Review');
        }
      }
      fetchGroup();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
        Connecting to community frequency...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 pb-24 px-4 text-center max-w-lg mx-auto space-y-4">
        <Users className="w-12 h-12 text-zinc-600 mx-auto" />
        <h2 className="text-xl font-bold font-serif">Community Not Found</h2>
        <p className="text-xs text-zinc-400">
          The requested sanctuary circle does not exist or has been archived.
        </p>
        <Link
          href="/kinksters/groups"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold rounded-xl inline-block"
        >
          ← Back to All Communities
        </Link>
      </div>
    );
  }

  const isMember = group.user_membership?.status === 'active';
  const isPending = group.user_membership?.status === 'pending';
  const isOwner = group.user_membership?.role === 'owner';
  const isAdmin = isOwner || group.user_membership?.role === 'admin';

  const displayCover = group.cover_url || 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1200';
  const displayAvatar = group.avatar_url || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400';

  return (
    <div className="min-h-screen bg-black text-white pt-20 sm:pt-24 pb-28">
      {/* Hero Cover Banner */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-zinc-900">
        <img
          src={displayCover}
          alt={group.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Back Link */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/kinksters/groups"
            className="px-3 py-1.5 rounded-full bg-black/70 hover:bg-black text-zinc-300 hover:text-white border border-white/15 text-xs font-mono flex items-center gap-1.5 backdrop-blur-md transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Communities</span>
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-20">
        {/* Profile Card Header */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={displayAvatar}
                alt={group.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-purple-500/40 shadow-2xl shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white font-serif">
                    {group.name}
                  </h1>
                  {isOwner && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold">
                      Owner 👑
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                    {group.category}
                  </span>
                  <span className="flex items-center gap-1">
                    {group.visibility === 'public' ? (
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="capitalize">{group.visibility.replace('_', ' ')}</span>
                  </span>
                  <span>•</span>
                  <span>{group.members_count || 1} members</span>
                </div>
              </div>
            </div>

            {/* Membership Action Button */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={handleJoinOrLeave}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs font-mono transition-all shadow-md active:scale-95 cursor-pointer ${
                  isMember
                    ? 'bg-zinc-900 hover:bg-rose-950/40 hover:text-rose-300 border border-zinc-800 text-zinc-300'
                    : isPending
                    ? 'bg-amber-950/40 border border-amber-500/40 text-amber-300'
                    : 'bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white'
                }`}
              >
                {isMember ? 'Joined ✓ (Leave)' : isPending ? 'Pending Review' : group.visibility === 'approval_required' ? 'Request Access' : 'Join Circle'}
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
            {group.description}
          </p>

          {/* Location Relevance Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-400 w-max">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Sanctuary Discovery Scope: <span className="text-amber-300 font-bold">{locationName}</span></span>
          </div>

          {/* 4 Unified Tabs: Posts, Events, People, About */}
          <div className="flex items-center gap-2 border-t border-zinc-900 pt-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'feed', label: `Posts (${group.posts?.length || 0})`, icon: Flame },
              { id: 'events', label: `Events (${group.events?.length || 0})`, icon: Calendar },
              { id: 'members', label: `People (${group.members?.length || group.members_count || 1})`, icon: Users },
              { id: 'about', label: 'About', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Feed & Reflections */}
        {activeTab === 'feed' && (
          <div className="mt-8 space-y-6">
            {/* Share Post Button in Group */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white font-mono block">Share Community Reflection</span>
                  <span className="text-[10px] text-zinc-500">Post photos and discussions directly to {group.name}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isMember) {
                    toast.error('You must join this community before posting.');
                    return;
                  }
                  setShowCreatePostModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs font-mono rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Post Reflection
              </button>
            </div>

            {/* Posts Grid */}
            {(!group.posts || group.posts.length === 0) ? (
              <div className="text-center py-16 bg-zinc-950 border border-zinc-900 rounded-3xl p-8 space-y-3">
                <Flame className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-base font-bold text-white font-mono">No Community Posts Yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Be the first member to share a photo reflection or dialogue inside this circle!
                </p>
              </div>
            ) : (
              <div className="space-y-6 max-w-xl mx-auto">
                {group.posts.map((post: any) => (
                  <div
                    key={post.id}
                    className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl"
                  >
                    {/* Author */}
                    <div className="p-4 border-b border-zinc-900 flex items-center gap-3">
                      <img
                        src={post.kinkster_profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full object-cover border border-purple-500/40"
                      />
                      <div>
                        <span className="text-xs font-bold text-white font-mono block">
                          @{post.kinkster_profiles?.alias || 'anonymous'}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Media */}
                    <div className="relative aspect-square bg-zinc-900 overflow-hidden">
                      <img
                        src={post.media_url}
                        alt="Post media"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Caption & Likes */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <span className="flex items-center gap-1 text-rose-400 font-bold">
                          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          {post.likes_count || 0}
                        </span>
                      </div>
                      {post.caption && (
                        <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                          {post.caption}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Events */}
        {activeTab === 'events' && (
          <div className="mt-8 space-y-4">
            {(!group.events || group.events.length === 0) ? (
              <div className="text-center py-16 bg-zinc-950 border border-zinc-900 rounded-3xl p-8 space-y-3">
                <Calendar className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-base font-bold text-white font-mono">No Scheduled Soirées</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  This community currently has no upcoming gatherings scheduled. Check back soon!
                </p>
              </div>
            ) : (
              group.events.map((event: any) => (
                <div
                  key={event.id}
                  className="p-5 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase">
                        {event.tier}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white font-serif">
                      {event.title}
                    </h4>

                    {event.tagline && (
                      <p className="text-xs text-amber-400/90 font-mono">
                        {event.tagline}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedEventForDossier(event)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Gathering Dossier</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Members */}
        {activeTab === 'members' && (
          <div className="mt-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(group.members || []).map((member) => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                      alt={member.alias}
                      className="w-10 h-10 rounded-full object-cover border border-purple-500/30 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white font-mono truncate">
                          @{member.alias}
                        </span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {member.role === 'owner' ? 'Community Creator 👑' : member.role === 'admin' ? 'Co-Organizer' : 'Member'}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 text-[9px] font-mono capitalize">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: About & Etiquette */}
        {activeTab === 'about' && (
          <div className="mt-8 space-y-6 max-w-2xl bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white font-serif">About This Circle</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {group.description}
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-zinc-900">
              <h3 className="text-sm font-bold text-amber-300 font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Community Etiquette &amp; Discretion Rules
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-mono bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                {group.rules || '1. Mutual, enthusiastic consent is mandatory at all times.\n2. Discretion inside and outside the sanctuary network is absolute.\n3. Zero tolerance for uninvited physical contact or photo recordings.'}
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-zinc-900 text-xs font-mono text-zinc-400">
              <span className="block font-bold text-white">Organizer Details</span>
              <p>Founded by @{group.kinkster_profiles?.alias || 'Sanctuary Guild'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Create Post Modal with group_id */}
      {showCreatePostModal && (
        <CreatePostModal
          isOpen={showCreatePostModal}
          onClose={() => setShowCreatePostModal(false)}
          defaultGroupId={group.id}
          onPostCreated={() => {
            setShowCreatePostModal(false);
            fetchGroup();
          }}
          userAlias={group.kinkster_profiles?.alias}
        />
      )}

      {/* Embedded Dossier Modal */}
      {selectedEventForDossier && (
        <EventDossierModal
          isOpen={!!selectedEventForDossier}
          onClose={() => setSelectedEventForDossier(null)}
          event={selectedEventForDossier}
          isLoggedIn={true}
          hasSanctuaryPass={true}
          onRequestPass={() => setSelectedEventForDossier(null)}
          onBuySanctuaryPass={() => setSelectedEventForDossier(null)}
        />
      )}
    </div>
  );
}

export default function GroupDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
        Loading community...
      </div>
    }>
      <GroupDetailContent />
    </Suspense>
  );
}
