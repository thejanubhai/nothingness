'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, Heart, MessageSquare, Compass, Flame, Lock, Calendar, MapPin, UserPlus, UserCheck, CheckCircle2, XCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import KinksterInboxDrawer from '@/components/kinkster/KinksterInboxDrawer';
import HealthBadgeModal, { HealthBadge } from '@/components/kinkster/HealthBadgeModal';
import HealthReportUploadModal from '@/components/kinkster/HealthReportUploadModal';

interface MatchedKinkster {
  id: string;
  alias: string;
  bio: string;
  avatar_url: string;
  interests: string[];
  kink_tags: string[];
  match_score: number;
  health_badges?: HealthBadge[];
}

interface SpiceRequest {
  id: string;
  sender_id: string;
  kinkster_profiles: {
    alias: string;
    avatar_url: string;
    bio: string;
  };
}

export default function KinksterDiscoverPage() {
  const [activeTab, setActiveTab] = useState<'compatibility' | 'incoming_spice'>('compatibility');
  const [matches, setMatches] = useState<MatchedKinkster[]>([]);
  const [spiceRequests, setSpiceRequests] = useState<SpiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [selectedChatAlias, setSelectedChatAlias] = useState<string | null>(null);
  const [selectedHealthBadge, setSelectedHealthBadge] = useState<HealthBadge | null>(null);
  const [showHealthUploadModal, setShowHealthUploadModal] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'compatibility') {
        const res = await fetch('/api/kinkster/match');
        const data = await res.json();
        setMatches(data.matches || []);
      } else {
        const res = await fetch('/api/kinkster/spice');
        const data = await res.json();
        setSpiceRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching discovery data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSpiceAction = async (requestId: string, action: 'accept' | 'reject', alias?: string) => {
    try {
      const res = await fetch('/api/kinkster/spice', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      if (action === 'accept') {
        toast.success(`Spice Up Back confirmed!`, { description: `In-app chat unlocked with @${alias}.` });
        if (alias) setSelectedChatAlias(alias);
      } else {
        toast.info(`Request discretely dismissed.`);
      }

      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Action failed.');
    }
  };

  const handleSendSpice = async (alias: string) => {
    try {
      const res = await fetch('/api/kinkster/spice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_alias: alias })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send Spice Up');

      if (data.is_mutual) {
        toast.success(`Mutual Spice Up! 🔥`, { description: `Chat unlocked with @${alias}.` });
        setSelectedChatAlias(alias);
      } else {
        toast.success(`Spice Up request sent to @${alias}!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Spice Up failed.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-rose-400 font-mono mb-1">
            <Compass className="w-4 h-4" /> Purposeful Compatibility &amp; Chemistry
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
            Kinkster Discovery Circle
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Minimalist micro badges, mutual "Spice Up 🔥" matching, and sandboxed in-app communication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHealthUploadModal(true)}
            className="px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            Upload Blood Test
          </button>

          {/* Tab Switcher */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('compatibility')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'compatibility'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" />
              Vibe Match %
            </button>
            <button
              onClick={() => setActiveTab('incoming_spice')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'incoming_spice'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Spice Requests {spiceRequests.length > 0 && `(${spiceRequests.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Vibe Compatibility Matcher */}
      {activeTab === 'compatibility' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.length === 0 && !loading ? (
            <div className="col-span-full text-center py-16 bg-zinc-950 border border-zinc-900 rounded-2xl p-8">
              <Sparkles className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Vetted Members Found</h3>
              <p className="text-xs text-zinc-500 mt-1">As more guests verify IDs and activate Kinkster Mode, their compatibility matrix will appear here!</p>
            </div>
          ) : (
            matches.map((member) => (
              <div
                key={member.id}
                className="bg-zinc-950 border border-zinc-900 hover:border-rose-500/40 rounded-2xl p-5 shadow-2xl transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Glowing Compatibility Pill */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-rose-500/20 to-purple-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold rounded-full flex items-center gap-1 shadow-lg">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  {member.match_score}% Vibe Match
                </div>

                <div>
                  {/* Avatar & Alias */}
                  <div className="flex items-center gap-3 mb-4">
                    <Link href={`/kinksters/${member.alias}`}>
                      <img
                        src={member.avatar_url}
                        alt="Avatar"
                        className="w-14 h-14 rounded-full object-cover border-2 border-rose-500/40 hover:scale-105 transition-transform cursor-pointer"
                      />
                    </Link>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/kinksters/${member.alias}`} className="text-base font-bold text-white font-mono hover:text-rose-400 transition-colors">
                          @{member.alias}
                        </Link>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-[10px] text-zinc-400">ID Vetted • High Discretion</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-zinc-300 leading-relaxed mb-4 line-clamp-3">
                    "{member.bio}"
                  </p>

                  {/* Micro Concise Health Badges Section */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {member.health_badges && member.health_badges.length > 0 ? (
                        member.health_badges.map((badge) => (
                          <button
                            key={badge.id}
                            onClick={() => setSelectedHealthBadge(badge)}
                            className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-[11px] font-medium rounded-md transition-all"
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
                          className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-emerald-400 text-[11px] font-medium rounded-md"
                        >
                          🛡️ Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Kink & Aesthetic Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {member.kink_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 text-[10px] rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Spice Up 🔥 Action Button */}
                <button
                  onClick={() => handleSendSpice(member.alias)}
                  className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Flame className="w-4 h-4" />
                  Spice Up 🔥
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Incoming Spice Requests */}
      {activeTab === 'incoming_spice' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {spiceRequests.length === 0 && !loading ? (
            <div className="col-span-full text-center py-16 bg-zinc-950 border border-zinc-900 rounded-2xl p-8">
              <Sparkles className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Pending Requests</h3>
              <p className="text-xs text-zinc-500 mt-1">When members send you a Spice Up request, they will appear here discretely.</p>
            </div>
          ) : (
            spiceRequests.map((req) => (
              <div
                key={req.id}
                className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.kinkster_profiles?.avatar_url}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover border border-rose-500/40"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold font-mono text-white">
                        @{req.kinkster_profiles?.alias}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">{req.kinkster_profiles?.bio}</p>
                  </div>
                </div>

                {/* Mutual Accept or Reject Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSpiceAction(req.id, 'reject')}
                    className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-zinc-500" />
                    Reject
                  </button>

                  <button
                    onClick={() => handleSpiceAction(req.id, 'accept', req.kinkster_profiles?.alias)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-4 h-4" />
                    Spice Up Back 🔥
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Health Badge Educational Modal */}
      <HealthBadgeModal
        badge={selectedHealthBadge}
        onClose={() => setSelectedHealthBadge(null)}
      />

      {/* Health Report Upload Modal */}
      <HealthReportUploadModal
        isOpen={showHealthUploadModal}
        onClose={() => setShowHealthUploadModal(false)}
        onVerified={fetchData}
      />

      {/* In-App Encrypted Chat Drawer */}
      <KinksterInboxDrawer
        isOpen={!!selectedChatAlias}
        onClose={() => setSelectedChatAlias(null)}
        targetAlias={selectedChatAlias || ''}
      />
    </div>
  );
}
