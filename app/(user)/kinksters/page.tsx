'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  PlusCircle,
  AtSign,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Building2,
  CheckCircle2,
  Compass,
  Flame,
  Globe,
  Send,
  X,
  UserCheck,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Flag,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import KinksterLandingPage from '@/components/kinkster/KinksterLandingPage';
import KinksterOnboardingWizard from '@/components/kinkster/KinksterOnboardingWizard';
import CreatePostModal from '@/components/kinkster/CreatePostModal';
import IDUploadModal from '@/components/IDUploadModal';
import PullToRefresh from '@/components/PullToRefresh';
import DesireResonanceModal from '@/components/kinkster/DesireResonanceModal';
import EphemeralChatModal from '@/components/kinkster/EphemeralChatModal';
import KinksterInboxDrawer from '@/components/kinkster/KinksterInboxDrawer';
import FeedPostCard, { Post } from '@/components/kinkster/FeedPostCard';
import PostCommentDrawer from '@/components/kinkster/PostCommentDrawer';
import PostReportModal from '@/components/kinkster/PostReportModal';

interface ConversationThread {
  id: string;
  alias: string;
  avatar_url: string;
  bio: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

function KinkstersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [isIdVerified, setIsIdVerified] = useState<boolean>(false);
  const [userAlias, setUserAlias] = useState<string>('');
  const [entryFee, setEntryFee] = useState<number>(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 5-Pillar Cohesive Views
  const [activeView, setActiveView] = useState<'feed' | 'chats' | 'manifesto'>('feed');
  const [feedCategory, setFeedCategory] = useState<'all' | 'dynamics' | 'stories' | 'gatherings'>('all');

  // Modals & Drawers
  const [showActivationModal, setShowActivationModal] = useState<boolean>(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [selectedInitialFile, setSelectedInitialFile] = useState<File | null>(null);
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [showIdModal, setShowIdModal] = useState<boolean>(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Interactive Feed State (Likes, Saves, Double-tap heart pop)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [doubleTapHeartPostId, setDoubleTapHeartPostId] = useState<string | null>(null);
  const lastTapRef = useRef<Record<string, number>>({});

  // Reflections / Comments Modal State
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [commentDraft, setCommentDraft] = useState<string>('');
  const [postComments, setPostComments] = useState<Record<string, Array<{ id: string; alias: string; text: string; time: string }>>>({});
  const [loadingComments, setLoadingComments] = useState<boolean>(false);

  // Direct Whispers & Ephemeral Chambers
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(false);
  const [selectedChatAlias, setSelectedChatAlias] = useState<string | null>(null);

  // Dual-Blind Resonance & Ephemeral Chat
  const [activeResonanceTarget, setActiveResonanceTarget] = useState<{ alias: string; avatar?: string } | null>(null);
  const [activeChamber, setActiveChamber] = useState<{ token: string; targetAlias: string; targetAvatar?: string } | null>(null);
  const [mutualMatches, setMutualMatches] = useState<any[]>([]);

  // Post Reporting & Safety Moderation State
  const [reportedPostIds, setReportedPostIds] = useState<Set<string>>(new Set());
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState<string>('non_consensual');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);

  // Load Saved Vault Posts and Reported Posts from localStorage on mount
  useEffect(() => {
    try {
      const storedVault = localStorage.getItem('kinkster_saved_vault');
      if (storedVault) {
        setSavedPosts(new Set(JSON.parse(storedVault)));
      }
    } catch {}

    try {
      const storedReported = localStorage.getItem('kinkster_reported_posts');
      if (storedReported) {
        setReportedPostIds(new Set(JSON.parse(storedReported)));
      }
    } catch {}
  }, []);

  // Listen to URL search param ?tab= and ?activation=
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'chats' || tab === 'whispers') {
      setActiveView('chats');
    } else if (tab === 'manifesto') {
      setActiveView('manifesto');
    } else if (tab === 'feed') {
      setActiveView('feed');
    } else if (tab === 'discover' || tab === 'explore') {
      router.push('/kinksters/explore');
    } else if (tab === 'groups' || tab === 'communities') {
      router.push('/kinksters/groups');
    } else if (tab === 'events' || tab === 'soirees' || tab === 'gatherings') {
      router.push('/kinksters/events');
    }

    const activation = searchParams?.get('activation');
    const errorMsg = searchParams?.get('error');

    if (activation === 'success') {
      toast.success('Kinkster Mode Activated! ✨', {
        description: 'Your lifetime membership has been confirmed. Welcome to the sanctuary circle.',
      });
      fetchProfileAndPosts();
    } else if (activation === 'failed') {
      const decodedError = errorMsg ? decodeURIComponent(errorMsg) : 'Transaction was cancelled or declined at gateway.';
      toast.error('Activation Payment Incomplete', {
        description: decodedError,
      });
      setShowActivationModal(true);
    }
  }, [searchParams, router]);

  const fetchResonances = async () => {
    try {
      const res = await fetch('/api/kinkster/resonance');
      const data = await res.json();
      if (data.success && data.mutualMatches) {
        setMutualMatches(data.mutualMatches);
      }
    } catch {}
  };

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await fetch('/api/kinkster/chat');
      const data = await res.json();
      if (res.ok && data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchProfileAndPosts = async () => {
    setLoading(true);
    try {
      const profileRes = await fetch('/api/kinkster/profile');
      if (profileRes.status === 401) {
        setIsLoggedIn(false);
        setIsActivated(false);
        // Fetch public info for live entry fee
        fetch('/api/kinkster/info')
          .then((r) => r.json())
          .then((inf) => {
            if (inf?.entry_fee !== undefined) setEntryFee(Number(inf.entry_fee));
          })
          .catch(() => {});
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      const profileData = await profileRes.json();

      setIsIdVerified(profileData.is_id_verified ?? false);
      setIsActivated(profileData.is_activated ?? false);
      if (profileData.entry_fee !== undefined) {
        setEntryFee(Number(profileData.entry_fee));
      }
      if (profileData.profile?.alias) {
        setUserAlias(profileData.profile.alias);
      }
      if (profileData.profile?.avatar_url) {
        setUserAvatar(profileData.profile.avatar_url);
      }

      // If activated, fetch feed posts, mutual resonances, and whispers
      if (profileData.is_activated) {
        fetchResonances();
        fetchConversations();
        const postsRes = await fetch('/api/kinkster/posts');
        const postsData = await postsRes.json();
        const loadedPosts: Post[] = postsData.posts || [];
        setPosts(loadedPosts);

        // Pre-populate liked posts set
        const liked = new Set<string>();
        loadedPosts.forEach((p) => {
          if (p.is_liked) liked.add(p.id);
        });
        setLikedPosts(liked);
      }
    } catch (err) {
      console.error('Failed to load kinkster feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleOpenWithFile = (e: any) => {
      if (!isLoggedIn) {
        handleRequireAuth('create a post');
        return;
      }
      if (!isActivated) {
        setShowActivationModal(true);
        return;
      }
      const file = e.detail?.file || null;
      if (file) {
        setSelectedInitialFile(file);
        setShowCreatePostModal(true);
      }
    };

    const handleOpenCreatePost = () => {
      if (!isLoggedIn) {
        handleRequireAuth('create a post');
        return;
      }
      if (!isActivated) {
        setShowActivationModal(true);
        return;
      }
      // Directly trigger native gallery/file picker like Instagram
      galleryInputRef.current?.click();
    };

    window.addEventListener('open-create-post-with-file', handleOpenWithFile);
    window.addEventListener('open-create-post', handleOpenCreatePost);
    return () => {
      window.removeEventListener('open-create-post-with-file', handleOpenWithFile);
      window.removeEventListener('open-create-post', handleOpenCreatePost);
    };
  }, [isLoggedIn, isActivated]);

  useEffect(() => {
    const activation = searchParams?.get('activation');
    if (activation === 'success') {
      toast.success('Kinkster Mode Activated via PayU!', {
        description: 'Your lifetime membership payment has been confirmed.',
      });
    } else if (activation === 'failed') {
      const errorMsg = searchParams?.get('error') || 'Payment failed.';
      toast.error('Activation Payment Failed', { description: decodeURIComponent(errorMsg) });
    }
    fetchProfileAndPosts();
  }, [searchParams]);

  const handleRequireAuth = (actionName: string) => {
    toast.info('Sign In Required', {
      description: `Please sign in with Mobile OTP to ${actionName}.`,
    });
    router.push('/auth?redirect=/kinksters');
  };

  // Double-tap & single-tap like handler
  const handleToggleLike = async (postId: string) => {
    if (!isLoggedIn) {
      handleRequireAuth('like posts');
      return;
    }

    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch {}

    const wasLiked = likedPosts.has(postId);

    // Optimistic state update
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes_count: Math.max(0, (p.likes_count || 0) + (wasLiked ? -1 : 1)),
              is_liked: !wasLiked,
            }
          : p
      )
    );

    try {
      const res = await fetch('/api/kinkster/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update like');

      if (typeof data.is_liked === 'boolean') {
        setLikedPosts((prev) => {
          const next = new Set(prev);
          if (data.is_liked) next.add(postId);
          else next.delete(postId);
          return next;
        });
      }
      if (typeof data.likes_count === 'number') {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likes_count: data.likes_count } : p))
        );
      }
    } catch (err) {
      // Rollback optimistic update
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count: Math.max(0, (p.likes_count || 0) + (wasLiked ? 1 : -1)),
                is_liked: wasLiked,
              }
            : p
        )
      );
    }
  };

  const handleMediaTap = (postId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[postId] || 0;
    if (now - lastTap < 320) {
      // Double tap triggered
      setDoubleTapHeartPostId(postId);
      setTimeout(() => setDoubleTapHeartPostId(null), 800);
      if (!likedPosts.has(postId)) {
        handleToggleLike(postId);
      } else {
        try {
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([15, 60, 15]);
          }
        } catch {}
      }
    }
    lastTapRef.current[postId] = now;
  };

  // Toggle Save to Private Vault
  const handleToggleSave = (postId: string) => {
    if (!isLoggedIn) {
      handleRequireAuth('save posts');
      return;
    }
    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        toast.info('Removed from your Vault');
      } else {
        next.add(postId);
        toast.success('Saved to your Private Vault');
      }
      try {
        localStorage.setItem('kinkster_saved_vault', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Discreet Share Post
  const handleSharePost = async (post: Post) => {
    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/kinksters#${post.id}` : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Nothingness Lifestyle • @${post.kinkster_profiles?.alias || 'member'}`,
          text: post.caption || 'Discreet lifestyle reflection on Nothingness.',
          url: postUrl,
        });
        return;
      } catch {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(postUrl);
      toast.success('Discreet post link copied to clipboard!');
    }
  };

  // Open Confidential Report Modal
  const handleOpenReportModal = (post: Post) => {
    if (!isLoggedIn) {
      handleRequireAuth('report content');
      return;
    }
    setReportingPost(post);
    setReportReason('non_consensual');
    setReportDetails('');
  };

  // Submit Confidential Report to Moderation API
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

      // Optimistically hide from local feed
      const nextReported = new Set(reportedPostIds);
      nextReported.add(reportingPost.id);
      setReportedPostIds(nextReported);
      try {
        localStorage.setItem('kinkster_reported_posts', JSON.stringify(Array.from(nextReported)));
      } catch {}

      toast.success('Post Reported & Hidden', {
        description: 'The post has been removed from your feed. Our safety team is reviewing it.',
      });
      setReportingPost(null);
    } catch (err: any) {
      toast.error('Could not submit report. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Open reflections & load comments from API
  const handleOpenReflections = async (post: Post) => {
    setActiveCommentPost(post);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/kinkster/posts/comments?post_id=${encodeURIComponent(post.id)}`);
      const data = await res.json();
      if (res.ok && data.comments) {
        setPostComments((prev) => ({
          ...prev,
          [post.id]: data.comments.map((c: any) => ({
            id: c.id,
            alias: c.kinkster_profiles?.alias || 'anonymous',
            text: c.comment,
            time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })),
        }));
      }
    } catch {} finally {
      setLoadingComments(false);
    }
  };

  // Submit new reflection to API
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentDraft.trim() || !activeCommentPost) return;
    if (!isLoggedIn) {
      handleRequireAuth('reflect on posts');
      return;
    }

    const postId = activeCommentPost.id;
    const commentText = commentDraft.trim();
    setCommentDraft('');

    try {
      const res = await fetch('/api/kinkster/posts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, comment: commentText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post reflection');

      const newComment = {
        id: data.comment?.id || Math.random().toString(36).substring(2, 9),
        alias: userAlias || 'anonymous',
        text: commentText,
        time: 'Just now',
      };

      setPostComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));

      // Increment comments count on the post
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        )
      );

      toast.success('Reflection shared under your @alias');
    } catch (err: any) {
      toast.error(err.message || 'Could not post reflection');
      setCommentDraft(commentText);
    }
  };

  const filteredPosts = posts.filter((p) => {
    // Hide reported posts immediately
    if (reportedPostIds.has(p.id)) return false;
    if (feedCategory === 'all') return true;
    const text = (p.caption || '').toLowerCase();
    if (feedCategory === 'dynamics')
      return text.includes('art') || text.includes('dynamic') || text.includes('mood') || !text.includes('party');
    if (feedCategory === 'stories')
      return text.includes('story') || text.includes('confession') || text.includes('thought') || text.includes('reflection');
    if (feedCategory === 'gatherings')
      return text.includes('munch') || text.includes('soiree') || text.includes('event') || text.includes('gathering');
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white pt-28 sm:pt-32 pb-24">
      {/* ------------------------------------------------------------- */}
      {/* CASE A: UNACTIVATED USER -> SHOWCASE MESMERIZING VIP PORTAL   */}
      {/* ------------------------------------------------------------- */}
      {!isActivated && !loading && (
        <>
          {/* VIP Guest Invitation Banner for Authenticated Guests */}
          {isLoggedIn && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-2">
              <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-rose-950/30 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-mono uppercase tracking-widest mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                        <span>Sanctuary Guest Invitation • Claim Your Private Moniker</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif text-white font-bold">
                        Welcome to <span className="text-rose-400">The Circle</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                        As a verified sanctuary guest, you are invited to activate your private @alias, connect with vetted members under absolute confidentiality, and unlock secret soirées.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowActivationModal(true)}
                      className="shrink-0 px-5 py-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Activate Lifetime Pass {entryFee > 0 ? `• ₹${entryFee.toLocaleString('en-IN')}` : ''}</span>
                    </button>
                  </div>

                  {/* 2 Step Progress Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Step 1: ID Vetting */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Step 1</span>
                        {isIdVerified ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono">
                            Pending
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Private Identity Check</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                          {isIdVerified
                            ? 'Aadhaar / Passport verified on file (100% private).'
                            : 'Submit 1-click photo of your Aadhaar or Passport.'}
                        </p>
                      </div>
                      {!isIdVerified && (
                        <button
                          onClick={() => setShowIdModal(true)}
                          className="w-full py-2 bg-white/5 hover:bg-rose-500/20 border border-white/10 text-rose-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Verify ID in 1-Click →
                        </button>
                      )}
                    </div>

                    {/* Step 2: @Alias & Lifetime Pass */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Step 2</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-mono">
                          {entryFee > 0 ? `₹${entryFee.toLocaleString('en-IN')}` : 'Lifetime Pass'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Choose Private @Alias</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                          Set your anonymous handle &amp; activate lifetime membership.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowActivationModal(true)}
                        className="w-full py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-md cursor-pointer"
                      >
                        Choose @Alias &amp; Activate →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <KinksterLandingPage
            isActivated={isActivated}
            isIdVerified={isIdVerified}
            isStayVerified={true}
            entryFee={entryFee}
            onOpenActivation={() => {
              if (!isLoggedIn) {
                handleRequireAuth('activate your Lifestyle Membership');
              } else {
                setShowActivationModal(true);
              }
            }}
            onOpenIdVerification={() => {
              if (!isLoggedIn) {
                handleRequireAuth('verify your ID for Lifestyle Pass');
              } else {
                setShowIdModal(true);
              }
            }}
            onOpenStayVerification={() => {}}
          />
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CASE B: ACTIVATED USER -> PRIVATE 5-PILLAR MEMBER HUB         */}
      {/* ------------------------------------------------------------- */}
      {isActivated && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Member Header & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
                  Nothingness Lifestyle
                </h1>
                <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px] font-bold rounded-full flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  ID Vetted
                </span>
                <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[11px] font-bold rounded-full flex items-center gap-1 font-mono">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  Discretion Vetted
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Encrypted lifestyle network. Real identities remain 100% confidential.
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0 shrink-0">
              {mutualMatches.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const first = mutualMatches[0];
                    setActiveChamber({
                      token: first.chamberToken,
                      targetAlias: first.otherAlias,
                      targetAvatar: first.otherAvatar,
                    });
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-purple-600 border border-rose-400/40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 shadow-lg cursor-pointer animate-pulse"
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>{mutualMatches.length} Mutual Match{mutualMatches.length > 1 ? 'es' : ''}</span>
                </button>
              )}

              <Link
                href={`/kinksters/${userAlias || 'profile'}`}
                className="text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <AtSign className="w-3.5 h-3.5 text-rose-400" />
                {userAlias || 'My Moniker'}
              </Link>

              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    handleRequireAuth('create a post');
                    return;
                  }
                  if (!isActivated) {
                    setShowActivationModal(true);
                    return;
                  }
                  galleryInputRef.current?.click();
                }}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer touch-manipulation"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post</span>
              </button>
            </div>
          </div>

          {/* 5-Pillar Cohesive View Switcher (Desktop sub-nav, mobile handled via native bottom nav) */}
          <div className="hidden md:flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar border-b border-zinc-900 pb-3">
            <button
              onClick={() => setActiveView('feed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeView === 'feed'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/70 border border-zinc-800'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-400" />
              Feed
            </button>

            <Link
              href="/kinksters/events"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 text-zinc-400 hover:text-white bg-zinc-900/70 border border-zinc-800"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Gatherings
            </Link>

            <Link
              href="/kinksters/groups"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 text-zinc-400 hover:text-white bg-zinc-900/70 border border-zinc-800"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              Communities
            </Link>

            <Link
              href="/kinksters/explore"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 text-zinc-400 hover:text-white bg-zinc-900/70 border border-zinc-800"
            >
              <Compass className="w-4 h-4 text-purple-400" />
              Explore
            </Link>

            <button
              onClick={() => {
                setActiveView('chats');
                fetchConversations();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeView === 'chats'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/70 border border-zinc-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-rose-300" />
              <span>Whispers</span>
              {conversations.some((c) => c.unread_count > 0) && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveView('manifesto')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeView === 'manifesto'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/70 border border-zinc-800'
              }`}
            >
              <Globe className="w-4 h-4 text-zinc-400" />
              Sanctuary Manifesto
            </button>
          </div>

          {/* ========================================================= */}
          {/* PILLAR 1: MEMBER FEED                                     */}
          {/* ========================================================= */}
          {activeView === 'feed' && (
            <PullToRefresh onRefresh={fetchProfileAndPosts}>
              <div className="space-y-6 max-w-xl mx-auto">
                {/* Category Filter Pills in Unified Glassmorphic Segmented Container */}
                <div className="w-full overflow-x-auto no-scrollbar pb-1">
                  <div className="flex items-center gap-2 p-1.5 bg-zinc-950/90 border border-zinc-800/80 rounded-2xl backdrop-blur-xl w-max">
                    {[
                      { id: 'all', label: 'All Reflections' },
                      { id: 'dynamics', label: 'Art & Dynamics' },
                      { id: 'stories', label: 'Stories & Whispers' },
                      { id: 'gatherings', label: 'Secret Soirées' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFeedCategory(cat.id as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          feedCategory === cat.id
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredPosts.length === 0 ? (
                  <div className="text-center py-16 bg-zinc-950 border border-zinc-900 rounded-2xl p-8 shadow-2xl">
                    <Sparkles className="w-10 h-10 text-rose-400 mx-auto mb-3 opacity-60" />
                    <h3 className="text-base font-bold text-white">
                      {posts.length === 0 ? 'No Posts Yet' : 'No Posts in this Category'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 mb-4">
                      {posts.length === 0
                        ? 'Be the first vetted member to share a discreet photo reflection!'
                        : 'Try selecting "All Reflections" or share a post under this category.'}
                    </p>
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          handleRequireAuth('create a post');
                          return;
                        }
                        if (!isActivated) {
                          setShowActivationModal(true);
                          return;
                        }
                        galleryInputRef.current?.click();
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Create First Post
                    </button>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      userAlias={userAlias}
                      isLoggedIn={isLoggedIn}
                      isLiked={likedPosts.has(post.id)}
                      isSaved={savedPosts.has(post.id)}
                      commentsCount={post.comments_count || postComments[post.id]?.length || 0}
                      doubleTapHeartActive={doubleTapHeartPostId === post.id}
                      onMediaTap={handleMediaTap}
                      onToggleLike={handleToggleLike}
                      onToggleSave={handleToggleSave}
                      onOpenReflections={handleOpenReflections}
                      onSharePost={handleSharePost}
                      onOpenReport={handleOpenReportModal}
                      onRequireAuth={handleRequireAuth}
                      onOpenResonate={(target) => {
                        setActiveResonanceTarget(target);
                      }}
                    />
                  ))
                )}
              </div>
            </PullToRefresh>
          )}

          {/* ========================================================= */}
          {/* PILLAR 2: WHISPERS & DIRECT ENCRYPTED CHATS              */}
          {/* ========================================================= */}
          {activeView === 'chats' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Mutual Resonance Ephemeral Chambers Banner */}
              {mutualMatches.length > 0 && (
                <div className="bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-zinc-950 border border-rose-500/40 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {mutualMatches.length} Ephemeral Resonance Chamber{mutualMatches.length > 1 ? 's' : ''}
                        </h3>
                        <p className="text-[11px] text-zinc-400">
                          Dual-blind desire matches. Burn-on-read photos &amp; voice whispers.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const first = mutualMatches[0];
                        setActiveChamber({
                          token: first.chamberToken,
                          targetAlias: first.otherAlias,
                          targetAvatar: first.otherAvatar,
                        });
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all cursor-pointer"
                    >
                      Enter Chamber
                    </button>
                  </div>
                </div>
              )}

              {/* Conversations Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                  <h2 className="text-base font-bold text-white font-mono">Discreet Whispers</h2>
                  <span className="text-xs font-mono text-zinc-500">
                    ({conversations.length} active)
                  </span>
                </div>
                <button
                  onClick={fetchConversations}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Refresh Whispers"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingConversations ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingConversations ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center gap-3 animate-pulse"
                    >
                      <div className="w-12 h-12 rounded-full bg-zinc-800" />
                      <div className="flex-1 space-y-2">
                        <div className="w-24 h-3 rounded bg-zinc-800" />
                        <div className="w-48 h-2 rounded bg-zinc-900" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16 bg-zinc-950 border border-zinc-900 rounded-2xl p-8 shadow-2xl space-y-4">
                  <Lock className="w-10 h-10 text-rose-400/60 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-white">No Whispers Yet</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                      Spark members in Discover or drop a resonance on any post. When chemistry aligns, direct encrypted chats unlock automatically.
                    </p>
                  </div>
                  <Link
                    href="/kinksters/discover"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-lg hover:opacity-95 transition-all"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explore Discover Members</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {conversations.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedChatAlias(thread.alias)}
                      className="p-4 bg-zinc-950 hover:bg-zinc-900/80 border border-zinc-900 hover:border-rose-500/30 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative">
                          <img
                            src={thread.avatar_url}
                            alt={thread.alias}
                            className="w-12 h-12 rounded-full object-cover border border-rose-500/30 group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold font-mono text-white group-hover:text-rose-400 transition-colors">
                              @{thread.alias}
                            </span>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          </div>
                          <p className="text-xs text-zinc-400 truncate mt-0.5 max-w-xs sm:max-w-md">
                            {thread.last_message || 'Start conversation...'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {thread.last_message_time && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(thread.last_message_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        {thread.unread_count > 0 && (
                          <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full">
                            {thread.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PILLAR 3: SANCTUARY MANIFESTO & SHOWCASE                 */}
          {/* ========================================================= */}
          {activeView === 'manifesto' && (
            <KinksterLandingPage
              isActivated={isActivated}
              isIdVerified={isIdVerified}
              isStayVerified={true}
              entryFee={entryFee}
              onOpenActivation={() => setShowActivationModal(true)}
              onOpenIdVerification={() => setShowIdModal(true)}
              onOpenStayVerification={() => {}}
            />
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-8 max-w-xl mx-auto py-8 px-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl animate-pulse"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800" />
                  <div className="space-y-1.5">
                    <div className="w-24 h-3 rounded bg-zinc-800" />
                    <div className="w-36 h-2 rounded bg-zinc-900" />
                  </div>
                </div>
                <div className="w-12 h-2.5 rounded bg-zinc-800" />
              </div>
              <div className="aspect-square bg-gradient-to-b from-zinc-900 via-zinc-900/60 to-zinc-950 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-zinc-800 opacity-40" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full bg-zinc-800" />
                    <div className="w-5 h-5 rounded-full bg-zinc-800" />
                    <div className="w-5 h-5 rounded-full bg-zinc-800" />
                  </div>
                  <div className="w-5 h-5 rounded bg-zinc-800" />
                </div>
                <div className="w-3/4 h-3 rounded bg-zinc-800" />
                <div className="w-1/2 h-2.5 rounded bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODALS: Onboarding, ID Upload, Create Post                    */}
      {/* ------------------------------------------------------------- */}
      <KinksterOnboardingWizard
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        isIdVerified={isIdVerified}
        isStayVerified={true}
        entryFee={entryFee}
        onCompleted={fetchProfileAndPosts}
        onOpenIdVerification={() => {
          setShowActivationModal(false);
          setShowIdModal(true);
        }}
      />

      {/* Native Gallery / Camera Roll hidden file input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/gif,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setSelectedInitialFile(file);
            setShowCreatePostModal(true);
          }
          e.target.value = '';
        }}
      />

      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setSelectedInitialFile(null);
        }}
        onPostCreated={fetchProfileAndPosts}
        initialFile={selectedInitialFile}
        userAlias={userAlias}
        userAvatar={userAvatar}
      />

      <IDUploadModal
        isOpen={showIdModal}
        onClose={() => setShowIdModal(false)}
        onSuccess={() => {
          setShowIdModal(false);
          setIsIdVerified(true);
          fetchProfileAndPosts();
          setShowActivationModal(true);
        }}
      />

      {/* Discreet Reflections / Comments Bottom Sheet Modal */}
      <PostCommentDrawer
        isOpen={!!activeCommentPost}
        post={activeCommentPost}
        comments={activeCommentPost ? postComments[activeCommentPost.id] || [] : []}
        loading={loadingComments}
        draft={commentDraft}
        isLoggedIn={isLoggedIn}
        userAlias={userAlias}
        onDraftChange={setCommentDraft}
        onSubmit={handleAddComment}
        onClose={() => {
          setActiveCommentPost(null);
          setCommentDraft('');
        }}
      />

      {/* Dual-Blind Desire Resonance Modal */}
      {activeResonanceTarget && (
        <DesireResonanceModal
          isOpen={!!activeResonanceTarget}
          onClose={() => setActiveResonanceTarget(null)}
          targetAlias={activeResonanceTarget.alias}
          targetAvatar={activeResonanceTarget.avatar}
          onMatched={(chamberToken, targetAlias) => {
            setActiveChamber({
              token: chamberToken,
              targetAlias,
              targetAvatar: activeResonanceTarget.avatar,
            });
          }}
        />
      )}

      {/* Ephemeral Confidential Chat Chamber */}
      {activeChamber && (
        <EphemeralChatModal
          isOpen={!!activeChamber}
          onClose={() => setActiveChamber(null)}
          chamberToken={activeChamber.token}
          targetAlias={activeChamber.targetAlias}
          targetAvatar={activeChamber.targetAvatar}
          currentViewerAlias={userAlias}
        />
      )}

      {/* Encrypted In-App Chat Drawer */}
      <KinksterInboxDrawer
        isOpen={!!selectedChatAlias}
        onClose={() => setSelectedChatAlias(null)}
        targetAlias={selectedChatAlias || ''}
      />

      {/* Confidential Report Post Modal */}
      <PostReportModal
        isOpen={!!reportingPost}
        post={reportingPost}
        reason={reportReason}
        details={reportDetails}
        submitting={submittingReport}
        onReasonChange={setReportReason}
        onDetailsChange={setReportDetails}
        onSubmit={handleSubmitReport}
        onClose={() => setReportingPost(null)}
      />
    </div>
  );
}

export default function KinkstersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white pt-32 text-center text-xs font-mono text-white/40">
          Loading Kinkster Network...
        </div>
      }
    >
      <KinkstersContent />
    </Suspense>
  );
}
