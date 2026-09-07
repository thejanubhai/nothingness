'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, Flame, UserPlus, UserCheck, Lock, Grid, Film, Sparkles, MessageSquare, Star, Building2, X, Flag, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AudioVibePlayer from '@/components/kinkster/AudioVibePlayer';
import HealthBadgeModal, { HealthBadge } from '@/components/kinkster/HealthBadgeModal';
import KinksterInboxDrawer from '@/components/kinkster/KinksterInboxDrawer';
import DiscretionRatingModal from '@/components/kinkster/DiscretionRatingModal';
import JointBookingModal from '@/components/kinkster/JointBookingModal';
import DesireResonanceModal from '@/components/kinkster/DesireResonanceModal';
import EphemeralChatModal from '@/components/kinkster/EphemeralChatModal';

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
  const [followersCount, setFollowersCount] = useState(0);
  const [discretionRating, setDiscretionRating] = useState({ avg_discretion: 5.0, total_ratings: 0 });
  const [spiceStatus, setSpiceStatus] = useState<'none' | 'pending' | 'mutual'>('none');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedHealthBadge, setSelectedHealthBadge] = useState<HealthBadge | null>(null);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showJointBookingModal, setShowJointBookingModal] = useState(false);
  const [showResonanceModal, setShowResonanceModal] = useState(false);
  const [activeChamberToken, setActiveChamberToken] = useState<string | null>(null);

  // Dynamic Viewer Watermarking & Lightbox Modal
  const [viewerAlias, setViewerAlias] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Reporting State
  const [reportedPostIds, setReportedPostIds] = useState<Set<string>>(new Set());
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState<string>('non_consensual');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);

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

      // 3. Fetch Follow State & Followers count
      const followRes = await fetch(`/api/kinkster/follow?alias=${encodeURIComponent(alias)}`);
      const followData = await followRes.json();
      if (followRes.ok) {
        setIsFollowing(followData.is_following ?? false);
        setFollowersCount(followData.followers_count ?? 0);
      }

      // 4. Fetch Discretion Ratings
      const ratingsRes = await fetch(`/api/kinkster/ratings?alias=${encodeURIComponent(alias)}`);
      const ratingsData = await ratingsRes.json();
      if (ratingsRes.ok) {
        setDiscretionRating({
          avg_discretion: ratingsData.avg_discretion ?? 5.0,
          total_ratings: ratingsData.total_ratings ?? 0
        });
      }
    } catch (err) {
      console.error('Error fetching kinkster profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [alias]);

  // Fetch current viewer profile & load reported posts
  useEffect(() => {
    fetch('/api/kinkster/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d?.profile?.alias) {
          setViewerAlias(d.profile.alias);
        }
      })
      .catch(() => {});

    try {
      const storedReported = localStorage.getItem('kinkster_reported_posts');
      if (storedReported) {
        setReportedPostIds(new Set(JSON.parse(storedReported)));
      }
    } catch {}
  }, []);

  const handleOpenReportModal = (post: Post) => {
    setReportingPost(post);
    setReportReason('non_consensual');
    setReportDetails('');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost) return;

    setSubmittingReport(true);
    try {
      const reasonLabels: Record<string, string> = {
        non_consensual: 'Non-consensual media / leak of identity',
        underage: 'Underage or authenticity concern',
        harassment: 'Harassment, threat or coercion',
        spam: 'Commercial spam or solicitation',
        guidelines: 'Sanctuary guideline breach',
      };

      await fetch('/api/kinkster/posts/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: reportingPost.id,
          reason: reasonLabels[reportReason] || reportReason,
          details: reportDetails.trim(),
        }),
      });

      const nextReported = new Set(reportedPostIds);
      nextReported.add(reportingPost.id);
      setReportedPostIds(nextReported);
      try {
        localStorage.setItem('kinkster_reported_posts', JSON.stringify(Array.from(nextReported)));
      } catch {}

      toast.success('Post Reported & Hidden', {
        description: 'The photo has been removed from view. Our safety team is reviewing it.',
      });
      setReportingPost(null);
      if (selectedPost?.id === reportingPost.id) {
        setSelectedPost(null);
      }
    } catch (err: any) {
      toast.error('Could not submit report. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

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
      setFollowersCount(prev => (data.is_following ? prev + 1 : Math.max(0, prev - 1)));
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
        <p className="text-xs text-zinc-500 mt-1">This `@{alias}` profile is either inactive or private.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-28 sm:pt-32 pb-24 px-4 sm:px-6 max-w-4xl mx-auto">
      
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
              <p className="text-xs text-zinc-400 mt-1 font-mono flex items-center gap-2">
                <span>ID Vetted</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{discretionRating.avg_discretion} ★ Discretion</span>
                <span>•</span>
                <span>{followersCount} Followers</span>
              </p>

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

          {/* Action Buttons: Spice Up 🔥, Follow, Rate Discretion, & Joint Stay */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setShowJointBookingModal(true)}
              className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-rose-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4 text-rose-400" />
              Joint Stay
            </button>

            <button
              onClick={() => setShowRatingModal(true)}
              className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Rate
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
              onClick={() => setShowResonanceModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              Resonate
            </button>

            <button
              onClick={spiceStatus === 'mutual' ? () => setShowChatDrawer(true) : handleSpiceUp}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-rose-500" />
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
          <span>Photos &amp; Media Grid</span>
        </div>

        {(() => {
          const visiblePosts = posts.filter((p) => !reportedPostIds.has(p.id));
          if (visiblePosts.length === 0) {
            return (
              <div className="text-center py-12 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 text-zinc-500 text-xs">
                No public media shared by @{alias} yet.
              </div>
            );
          }
          return (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {visiblePosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden group cursor-pointer border border-zinc-900 hover:border-rose-500/40 transition-all shadow-md"
                >
                  <img src={post.media_url} alt="Post" className="w-full h-full object-cover" />

                  {/* Dynamic Anti-Leak Viewer Watermark on grid thumbnail */}
                  <div 
                    className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-1.5 opacity-25 overflow-hidden mix-blend-screen"
                    aria-hidden="true"
                  >
                    <span className="text-[8px] font-mono font-bold tracking-wider text-white/80 rotate-[-6deg] origin-top-left">
                      @{viewerAlias || 'confidential'}
                    </span>
                    <span className="text-[7px] font-mono font-bold tracking-widest text-white/70 rotate-[-25deg] self-center">
                      VAULT • @{viewerAlias || 'confidential'}
                    </span>
                    <span className="text-[8px] font-mono font-bold tracking-wider text-white/80 rotate-[-6deg] origin-bottom-right self-end">
                      PROTECTED
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Sparkles className="w-5 h-5 text-white drop-shadow" />
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl space-y-3">
            {/* Top Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-white">@{alias}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReportModal(selectedPost)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-zinc-900 cursor-pointer"
                  title="Report photo"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-full bg-zinc-900 border border-zinc-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Media with Dynamic Anti-Leak Watermark */}
            <div className="relative aspect-square bg-zinc-900 overflow-hidden select-none">
              <img
                src={selectedPost.media_url}
                alt="Selected"
                className="w-full h-full object-cover pointer-events-none"
              />

              {/* Dynamic Anti-Leak Viewer Watermark */}
              <div 
                className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 opacity-25 overflow-hidden mix-blend-screen"
                aria-hidden="true"
              >
                <div className="flex justify-between items-start text-[10px] font-mono font-bold tracking-widest text-white/80 drop-shadow rotate-[-8deg] origin-top-left">
                  <span>@{viewerAlias || 'confidential'} • PROTECTED</span>
                  <span>{viewerAlias ? `@${viewerAlias}` : 'CONFIDENTIAL'}</span>
                </div>
                <div className="flex justify-center items-center text-xs font-mono font-extrabold tracking-widest text-white/70 rotate-[-25deg]">
                  <span>NOTHINGNESS VAULT • @{viewerAlias || 'confidential'}</span>
                </div>
                <div className="flex justify-between items-end text-[10px] font-mono font-bold tracking-widest text-white/80 drop-shadow rotate-[-8deg] origin-bottom-right">
                  <span>@{viewerAlias || 'confidential'}</span>
                  <span>DO NOT REDISTRIBUTE</span>
                </div>
              </div>
            </div>

            {/* Caption & Timestamp */}
            <div className="p-4 pt-1 space-y-1.5">
              {selectedPost.caption && (
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedPost.caption}
                </p>
              )}
              <p className="text-[10px] font-mono text-zinc-500">
                {new Date(selectedPost.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confidential Report Post Modal */}
      {reportingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setReportingPost(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <Flag className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Report Content</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Reporting photo by{' '}
                <span className="font-mono text-rose-400 font-bold">@{alias}</span>. Reports are 100% confidential.
              </p>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-zinc-300">
                  Reason for report:
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'non_consensual', label: 'Non-consensual media / identity leak' },
                    { id: 'underage', label: 'Underage or identity authenticity concern' },
                    { id: 'harassment', label: 'Harassment, coercion or threat' },
                    { id: 'spam', label: 'Commercial spam or solicitations' },
                    { id: 'guidelines', label: 'Other sanctuary guideline breach' },
                  ].map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        reportReason === r.id
                          ? 'bg-rose-500/10 border-rose-500/40 text-white font-medium'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.id}
                        checked={reportReason === r.id}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="accent-rose-500"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400">
                  Additional details (optional):
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Help our moderation team understand what happened..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setReportingPost(null)}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submittingReport ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit & Hide Photo</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Joint Booking Modal */}
      <JointBookingModal
        isOpen={showJointBookingModal}
        onClose={() => setShowJointBookingModal(false)}
        targetAlias={alias}
      />

      {/* Chat Drawer */}
      <KinksterInboxDrawer
        isOpen={showChatDrawer}
        onClose={() => setShowChatDrawer(false)}
        targetAlias={alias}
      />

      {/* Desire Resonance Blind Pairing Modal */}
      {showResonanceModal && (
        <DesireResonanceModal
          isOpen={showResonanceModal}
          onClose={() => setShowResonanceModal(false)}
          targetAlias={alias}
          targetAvatar={profile.avatar_url}
          onMatched={(chamberToken) => {
            setActiveChamberToken(chamberToken);
            setShowResonanceModal(false);
          }}
          onResonated={() => {
            fetchProfileDetails();
          }}
        />
      )}

      {/* Ephemeral Confidential Chamber Modal */}
      {activeChamberToken && (
        <EphemeralChatModal
          isOpen={!!activeChamberToken}
          onClose={() => setActiveChamberToken(null)}
          chamberToken={activeChamberToken}
          targetAlias={alias}
          targetAvatar={profile.avatar_url}
        />
      )}
    </div>
  );
}
