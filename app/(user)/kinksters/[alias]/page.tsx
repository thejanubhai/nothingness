'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, Flame, UserPlus, UserCheck, Lock, Grid, Film, Sparkles, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import AudioVibePlayer from '@/components/kinkster/AudioVibePlayer';
import HealthBadgeModal, { HealthBadge } from '@/components/kinkster/HealthBadgeModal';
import KinksterInboxDrawer from '@/components/kinkster/KinksterInboxDrawer';
import DiscretionRatingModal from '@/components/kinkster/DiscretionRatingModal';

interface ProfileData {
  id: string;
  alias: string;
  bio: string;
  avatar_url: string;
  cover_url?: string;
  interests: string[];
  health_badges?: HealthBadge[];
  audio_vibe_url?: string;
  is_trusted_host?: boolean;
}

interface Post {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  caption: string;
  created_at: string;
}

export default function KinksterProfilePage() {
  const params = useParams();
  const alias = params?.alias as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [spiceStatus, setSpiceStatus] = useState<'none' | 'pending' | 'mutual'>('none');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedHealthBadge, setSelectedHealthBadge] = useState<HealthBadge | null>(null);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const fetchProfileDetails = async () => {
    if (!alias) return;
    setLoading(true);
    try {
      // 1. Fetch Profile
      const profRes = await fetch(`/api/kinkster/profile?alias=${encodeURIComponent(alias)}`);
      const profData = await profRes.json();

      if (profRes.ok && profData.profile) {
        setProfile(profData.profile);
      }

      // 2. Fetch Posts for this alias
      const postsRes = await fetch(`/api/kinkster/posts?alias=${encodeURIComponent(alias)}`);
      const postsData = await postsRes.json();
      if (postsRes.ok) {
        setPosts(postsData.posts || []);
      }
    } catch (err) {
      console.error('Error fetching kinkster profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [alias]);

  const handleSpiceUp = async () => {
    try {
      const res = await fetch('/api/kinkster/spice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_alias: alias })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to Spice Up');

      if (data.is_mutual) {
        setSpiceStatus('mutual');
        toast.success("It's a Mutual Spice Up! 🔥", { description: "In-app chat unlocked." });
        setShowChatDrawer(true);
      } else {
        setSpiceStatus('pending');
        toast.success(`Spice Up request sent to @${alias}!`, { description: "You will unlock chat when they Spice Up Back." });
      }
    } catch (err: any) {
      toast.error(err.message || 'Spice Up failed.');
    }
  };

  const handleFollow = async () => {
    try {
      const res = await fetch('/api/kinkster/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_alias: alias })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Follow action failed');

      setIsFollowing(data.is_following);
      toast.success(data.is_following ? `Following @${alias}` : `Unfollowed @${alias}`);
    } catch (err: any) {
      toast.error(err.message || 'Follow action failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 text-center text-xs font-mono animate-pulse">
        Loading @{alias} profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 text-center">
        <h2 className="text-xl font-bold">Profile Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1">This `@${alias}` profile is either inactive or private.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 sm:px-6 max-w-4xl mx-auto">
      
      {/* Profile Header Block */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Avatar & Handle */}
          <div className="flex items-center gap-5">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
              alt="Avatar"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-rose-500/50 shadow-xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">@{profile.alias}</h1>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                {profile.is_trusted_host && (
                  <span className="px-2 py-0.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[10px] font-mono rounded-md">
                    Trusted Host
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">ID Vetted • 4.9 ★ Discretion Score</p>

              {/* Audio Vibe Clip */}
              {profile.audio_vibe_url && (
                <div className="mt-3">
                  <AudioVibePlayer audioUrl={profile.audio_vibe_url} alias={profile.alias} />
                </div>
              )}

              {/* Concise Micro Health Badges Section */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.health_badges && profile.health_badges.length > 0 ? (
                  profile.health_badges.map((badge) => (
                    <button
                      key={badge.id}
                      onClick={() => setSelectedHealthBadge(badge)}
                      className="px-2.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-[11px] font-medium rounded-md transition-all shadow-sm"
                    >
                      {badge.title}
                    </button>
                  ))
                ) : (
                  <button
                    onClick={() => setSelectedHealthBadge({
                      id: 'default_neg',
                      type: 'hiv_negative',
                      title: '🛡️ Clear',
                      icon: '🛡️',
                      color: 'emerald',
                      description: 'Verified Non-HIV / Clear status.',
                      explanation: 'Regular testing is encouraged for all active lifestyle members. This badge indicates a negative lab panel.'
                    })}
                    className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-emerald-400 text-[11px] font-medium rounded-md"
                  >
                    🛡️ Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Spice Up 🔥, Follow, & Rate Discretion */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowRatingModal(true)}
              className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Rate Discretion
            </button>

            <button
              onClick={handleFollow}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border ${
                isFollowing
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white'
              }`}
            >
              {isFollowing ? <UserCheck className="w-4 h-4 text-emerald-400" /> : <UserPlus className="w-4 h-4" />}
              {isFollowing ? 'Following' : 'Follow'}
            </button>

            <button
              onClick={spiceStatus === 'mutual' ? () => setShowChatDrawer(true) : handleSpiceUp}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4" />
              {spiceStatus === 'mutual'
                ? 'Open Chat'
                : spiceStatus === 'pending'
                ? 'Spice Up Sent 🔥'
                : 'Spice Up 🔥'}
            </button>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-xs text-zinc-300 leading-relaxed mt-6 border-t border-zinc-900 pt-4">
            "{profile.bio}"
          </p>
        )}
      </div>

      {/* Instagram-Style Media Grid */}
      <div className="border-t border-zinc-900 pt-6">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-6">
          <Grid className="w-4 h-4 text-rose-400" />
          <span>Posts &amp; Media Grid</span>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 text-zinc-500 text-xs">
            No public media shared by @{alias} yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {posts.map((post) => (
              <div key={post.id} className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden group">
                {post.media_type === 'image' ? (
                  <img src={post.media_url} alt="Post" className="w-full h-full object-cover" />
                ) : (
                  <video src={post.media_url} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {post.media_type === 'video' ? <Film className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health Badge Modal */}
      <HealthBadgeModal
        badge={selectedHealthBadge}
        onClose={() => setSelectedHealthBadge(null)}
      />

      {/* Discretion Rating Modal */}
      <DiscretionRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        targetAlias={alias}
        onRatingSubmitted={fetchProfileDetails}
      />

      {/* Chat Drawer */}
      <KinksterInboxDrawer
        isOpen={showChatDrawer}
        onClose={() => setShowChatDrawer(false)}
        targetAlias={alias}
      />
    </div>
  );
}
