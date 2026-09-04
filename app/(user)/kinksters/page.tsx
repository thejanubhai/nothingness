'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import KinksterLandingPage from '@/components/kinkster/KinksterLandingPage';
import KinksterOnboardingWizard from '@/components/kinkster/KinksterOnboardingWizard';
import CreatePostModal from '@/components/kinkster/CreatePostModal';
import IDUploadModal from '@/components/IDUploadModal';
import StayProofUploadModal from '@/components/kinkster/StayProofUploadModal';
import FranchiseCrossPromoCard from '@/components/kinkster/FranchiseCrossPromoCard';

interface Post {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  caption: string;
  likes_count: number;
  created_at: string;
  kinkster_profiles: {
    alias: string;
    avatar_url: string;
  };
}

function KinkstersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [isIdVerified, setIsIdVerified] = useState<boolean>(false);
  const [isStayVerified, setIsStayVerified] = useState<boolean>(false);
  const [userAlias, setUserAlias] = useState<string>('');
  const [entryFee, setEntryFee] = useState<number>(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'feed' | 'manifesto'>('feed');

  // Modals
  const [showActivationModal, setShowActivationModal] = useState<boolean>(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [showIdModal, setShowIdModal] = useState<boolean>(false);
  const [showStayModal, setShowStayModal] = useState<boolean>(false);

  const handleRequireAuth = (actionName: string) => {
    toast.info('Sign In Required', {
      description: `Please sign in with Mobile OTP to ${actionName}.`,
    });
    router.push('/auth?redirect=/kinksters');
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
          .then(r => r.json())
          .then(inf => {
            if (inf?.entry_fee !== undefined) setEntryFee(Number(inf.entry_fee));
          })
          .catch(() => {});
        setLoading(false);
        return;
      }
      setIsLoggedIn(true);
      const profileData = await profileRes.json();

      setIsIdVerified(profileData.is_id_verified ?? false);
      setIsStayVerified(profileData.is_stay_verified ?? false);
      setIsActivated(profileData.is_activated ?? false);
      if (profileData.entry_fee !== undefined) {
        setEntryFee(Number(profileData.entry_fee));
      }
      if (profileData.profile?.alias) {
        setUserAlias(profileData.profile.alias);
      }

      // If activated, fetch feed posts
      if (profileData.is_activated) {
        const postsRes = await fetch('/api/kinkster/posts');
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      }
    } catch (err) {
      console.error('Failed to load kinkster feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleOpenCreatePost = () => {
      if (!isLoggedIn) {
        handleRequireAuth('create a post');
        return;
      }
      if (!isActivated) {
        setShowActivationModal(true);
        return;
      }
      setShowCreatePostModal(true);
    };

    window.addEventListener('open-create-post', handleOpenCreatePost);
    return () => window.removeEventListener('open-create-post', handleOpenCreatePost);
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

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-20">
      
      {/* ------------------------------------------------------------- */}
      {/* CASE A: UNACTIVATED USER -> SHOWCASE MESMERIZING LANDING PAGE */}
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
                        Welcome to the <span className="text-rose-400">Lifestyle Circle</span>
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

                  {/* 3 Step Progress Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
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

                    {/* Step 2: Stay Certification */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Step 2</span>
                        {isStayVerified ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Certified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono">
                            Pending
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Sanctuary Stay Check</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                          {isStayVerified
                            ? 'Confirmed sanctuary stay booking linked.'
                            : 'Link your Airbnb, MMT, or direct booking.'}
                        </p>
                      </div>
                      {!isStayVerified && (
                        <button
                          onClick={() => setShowStayModal(true)}
                          className="w-full py-2 bg-white/5 hover:bg-purple-500/20 border border-white/10 text-purple-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Verify Stay →
                        </button>
                      )}
                    </div>

                    {/* Step 3: @Alias & Lifetime Pass */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Step 3</span>
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
            isStayVerified={isStayVerified}
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
            onOpenStayVerification={() => {
              if (!isLoggedIn) {
                handleRequireAuth('verify your sanctuary stay');
              } else {
                setShowStayModal(true);
              }
            }}
          />
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CASE B: ACTIVATED USER -> PRIVATE MEMBER FEED & NAVIGATION    */}
      {/* ------------------------------------------------------------- */}
      {isActivated && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Member Header & View Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6 mb-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
                  Nothingness Lifestyle
                </h1>
                <span className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-full flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  ID Vetted
                </span>
                <span className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-full flex items-center gap-1 font-mono">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  Stay Certified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Private member feed under unique @aliases. Real names remain 100% confidential.
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0 shrink-0">
              <Link
                href="/kinksters/discover"
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 touch-manipulation"
              >
                <Compass className="w-4 h-4 text-purple-400" />
                Discover
              </Link>
              <Link
                href="/sanctuary-pass"
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 touch-manipulation"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Sanctuary Pass
              </Link>
              <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <AtSign className="w-3.5 h-3.5 text-rose-400" />
                {userAlias}
              </span>
              <button
                onClick={() => setShowCreatePostModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer touch-manipulation"
              >
                <PlusCircle className="w-4 h-4" />
                New Post
              </button>
            </div>
          </div>

          {/* Member Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 mb-8 border-b border-zinc-900 pb-3">
            <button
              onClick={() => setActiveView('feed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeView === 'feed'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
            >
              <Flame className="w-4 h-4" />
              Member Feed
            </button>

            <button
              onClick={() => setActiveView('manifesto')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeView === 'manifesto'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
            >
              <Globe className="w-4 h-4" />
              Sanctuary Showcase &amp; Manifesto
            </button>
          </div>

          {/* Tab 1: Member Feed */}
          {activeView === 'feed' && (
            <div className="space-y-8 max-w-xl mx-auto">
              {posts.length === 0 ? (
                <div className="text-center py-16 bg-zinc-950 border border-zinc-900 rounded-2xl p-8 shadow-2xl">
                  <Sparkles className="w-10 h-10 text-rose-400 mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold text-white">No Posts Yet</h3>
                  <p className="text-xs text-zinc-500 mt-1 mb-4">Be the first vetted member to share a discreet photo or video reel!</p>
                  <button
                    onClick={() => setShowCreatePostModal(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Create First Post
                  </button>
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-zinc-800"
                  >
                    {/* Instagram Post Header */}
                    <div className="flex items-center justify-between p-4 border-b border-zinc-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.kinkster_profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover border border-rose-500/40 p-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white font-mono">
                              @{post.kinkster_profiles?.alias || 'anonymous'}
                            </span>
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="text-[10px] text-zinc-500">ID Vetted • Verified Stay Guest</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-zinc-600 font-mono">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Media Content */}
                    <div className="relative aspect-square bg-zinc-900">
                      {post.media_type === 'image' ? (
                        <img src={post.media_url} alt="Post" className="w-full h-full object-cover" />
                      ) : (
                        <video src={post.media_url} controls className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Interaction Footer */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-zinc-400">
                        <div className="flex items-center gap-4">
                          <button className="hover:text-rose-500 transition-colors">
                            <Heart className="w-5 h-5" />
                          </button>
                          <button className="hover:text-white transition-colors">
                            <MessageSquare className="w-5 h-5" />
                          </button>
                          <button className="hover:text-white transition-colors">
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                        <button className="hover:text-amber-400 transition-colors">
                          <Bookmark className="w-5 h-5" />
                        </button>
                      </div>

                      {post.caption && (
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          <span className="font-bold text-white font-mono mr-2">
                            @{post.kinkster_profiles?.alias}
                          </span>
                          {post.caption}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Sanctuary Manifesto & Feature Showcase */}
          {activeView === 'manifesto' && (
            <KinksterLandingPage
              isActivated={isActivated}
              isIdVerified={isIdVerified}
              isStayVerified={isStayVerified}
              entryFee={entryFee}
              onOpenActivation={() => setShowActivationModal(true)}
              onOpenIdVerification={() => setShowIdModal(true)}
              onOpenStayVerification={() => setShowStayModal(true)}
            />
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="text-center py-32 text-xs font-mono text-zinc-500 animate-pulse">
          Authenticating Discreet Sanctuary Vault...
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODALS: Onboarding, ID Upload, Stay Proof Upload, Create Post */}
      {/* ------------------------------------------------------------- */}
      <KinksterOnboardingWizard
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        isIdVerified={isIdVerified}
        isStayVerified={isStayVerified}
        entryFee={entryFee}
        onCompleted={fetchProfileAndPosts}
        onOpenIdVerification={() => {
          setShowActivationModal(false);
          setShowIdModal(true);
        }}
        onOpenStayVerification={() => {
          setShowActivationModal(false);
          setShowStayModal(true);
        }}
      />

      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        onPostCreated={fetchProfileAndPosts}
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

      <StayProofUploadModal
        isOpen={showStayModal}
        onClose={() => setShowStayModal(false)}
        onSuccess={() => {
          setShowStayModal(false);
          setIsStayVerified(true);
          setShowActivationModal(true);
        }}
      />
    </div>
  );
}

export default function KinkstersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white pt-32 text-center text-xs font-mono text-white/40">Loading Kinkster Network...</div>}>
      <KinkstersContent />
    </Suspense>
  );
}
