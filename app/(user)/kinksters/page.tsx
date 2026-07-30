'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Sparkles, PlusCircle, AtSign, Heart, MessageSquare, Bookmark, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import KinksterOnboardingWizard from '@/components/kinkster/KinksterOnboardingWizard';
import CreatePostModal from '@/components/kinkster/CreatePostModal';
import IDUploadModal from '@/components/IDUploadModal';

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

export default function KinkstersFeedPage() {
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [isIdVerified, setIsIdVerified] = useState<boolean>(false);
  const [userAlias, setUserAlias] = useState<string>('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showActivationModal, setShowActivationModal] = useState<boolean>(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [showIdModal, setShowIdModal] = useState<boolean>(false);

  const fetchProfileAndPosts = async () => {
    setLoading(true);
    try {
      // 1. Fetch user status
      const profileRes = await fetch('/api/kinkster/profile');
      const profileData = await profileRes.json();

      setIsIdVerified(profileData.is_id_verified ?? false);
      setIsActivated(profileData.is_activated ?? false);
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
    fetchProfileAndPosts();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
              Nothingness Kinksters
            </h1>
            <span className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              ID Vetted Discretion
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Exclusive Instagram-style private feed for vetted members under unique aliases.
          </p>
        </div>

        {isActivated ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-rose-400" />
              {userAlias}
            </span>
            <button
              onClick={() => setShowCreatePostModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              New Post
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowActivationModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center gap-2 animate-pulse"
          >
            <Sparkles className="w-4 h-4" />
            Activate Kinkster Mode
          </button>
        )}
      </div>

      {/* Unactivated State Banner */}
      {!isActivated && !loading && (
        <div className="mb-10 p-8 rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-rose-500/5 backdrop-blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto bg-rose-500/20 border border-rose-500/40 rounded-full flex items-center justify-center text-rose-400 shadow-xl">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Strictly Confidential Space</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This feed is reserved for Aadhaar/Passport vetted Nothingness guests. Create your unique <span className="text-rose-400 font-mono">@alias</span> and accept the Discretion Agreement to view & share posts.
            </p>
            <button
              onClick={() => setShowActivationModal(true)}
              className="mt-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-xl transition-all"
            >
              Activate Kinkster Mode Now
            </button>
          </div>
        </div>
      )}

      {/* Instagram Feed List */}
      {isActivated && (
        <div className="space-y-8 max-w-xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-zinc-950 border border-zinc-900 rounded-2xl p-8">
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
                      <span className="text-[10px] text-zinc-500">ID Vetted Member</span>
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

      {/* Onboarding Wizard Modal */}
      <KinksterOnboardingWizard
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        isIdVerified={isIdVerified}
        onCompleted={fetchProfileAndPosts}
        onOpenIdVerification={() => setShowIdModal(true)}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        onPostCreated={fetchProfileAndPosts}
      />

      {/* ID Upload Modal */}
      <IDUploadModal
        isOpen={showIdModal}
        onClose={() => setShowIdModal(false)}
        onSuccess={() => {
          setShowIdModal(false);
          setIsIdVerified(true);
          setShowActivationModal(true);
        }}
      />
    </div>
  );
}
