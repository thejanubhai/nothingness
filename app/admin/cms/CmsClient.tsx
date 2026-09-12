'use client';

import { useState } from 'react';
import { 
  Sparkles, Save, CheckCircle2, Globe, Flame, Ticket, ShieldCheck, 
  ExternalLink, Layers, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export type CmsBlock = {
  id?: string;
  block_key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  is_active?: boolean;
};

export default function CmsClient({ initialBlocks }: { initialBlocks: CmsBlock[] }) {
  const router = useRouter();
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Convert array to key-indexed map for clean state updates
  const [blocks, setBlocks] = useState<Record<string, CmsBlock>>(() => {
    const map: Record<string, CmsBlock> = {};
    for (const b of initialBlocks) {
      map[b.block_key] = b;
    }
    return map;
  });

  const [savedSnapshots, setSavedSnapshots] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const b of initialBlocks) {
      map[b.block_key] = JSON.stringify(b);
    }
    return map;
  });

  const [activeTab, setActiveTab] = useState<'hero' | 'trust' | 'lifestyle' | 'sanctuary'>('hero');

  const updateField = (key: string, field: keyof CmsBlock, value: any) => {
    setBlocks(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { block_key: key, title: '', subtitle: '', body: '' }),
        [field]: value,
      }
    }));
  };

  const handleSaveBlock = async (key: string) => {
    const block = blocks[key];
    if (!block) return;

    setSavingKey(key);
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(block),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save CMS block');

      setSavedSnapshots(prev => ({
        ...prev,
        [key]: JSON.stringify(data.block),
      }));

      toast.success(`Saved "${key}" to live website!`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Error saving block');
    } finally {
      setSavingKey(null);
    }
  };

  const isBlockDirty = (key: string) => {
    const current = JSON.stringify(blocks[key] || {});
    const saved = savedSnapshots[key] || '{}';
    return current !== saved;
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl md:text-4xl text-white">Homepage CMS</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
              Live Sync
            </span>
          </div>
          <p className="text-white/50 text-xs md:text-sm tracking-wide mt-1">
            Edit front-end headlines, trust highlights, and showcase banners without touching code.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono transition-colors self-start sm:self-auto"
        >
          <span>View Public Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-white/50" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-white/10 gap-6">
        {[
          { id: 'hero', name: 'Hero & Badge', icon: Sparkles },
          { id: 'trust', name: 'Trust Cards (3)', icon: ShieldCheck },
          { id: 'lifestyle', name: 'Lifestyle Showcase', icon: Flame },
          { id: 'sanctuary', name: 'Sanctuary Pass Showcase', icon: Ticket },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-accent-gold text-accent-gold'
                : 'border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* CONTENT SECTIONS */}
      <div className="space-y-8">

        {/* 1. HERO SECTION */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            {/* Top Pill / Badge */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-accent-gold">Micro-Pill / Banner Badge</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Top Eyebrow Badge</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveBlock('homepage_badge')}
                  disabled={savingKey === 'homepage_badge' || !isBlockDirty('homepage_badge')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                    isBlockDirty('homepage_badge')
                      ? 'bg-accent-gold hover:bg-white text-black'
                      : 'bg-white/5 text-white/40 border border-white/10'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingKey === 'homepage_badge' ? 'Saving...' : isBlockDirty('homepage_badge') ? 'Save Badge' : 'Saved'}
                </button>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">Badge Text</label>
                <input
                  type="text"
                  value={blocks['homepage_badge']?.title || ''}
                  onChange={(e) => updateField('homepage_badge', 'title', e.target.value)}
                  placeholder="e.g. India's Premier Luxury Private Sanctuaries"
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                />
              </div>
            </div>

            {/* Main Headline & Description */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-accent-gold">Primary Hero</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Homepage Main Headline &amp; Subtitle</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveBlock('homepage_hero')}
                  disabled={savingKey === 'homepage_hero' || !isBlockDirty('homepage_hero')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                    isBlockDirty('homepage_hero')
                      ? 'bg-accent-gold hover:bg-white text-black'
                      : 'bg-white/5 text-white/40 border border-white/10'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingKey === 'homepage_hero' ? 'Saving...' : isBlockDirty('homepage_hero') ? 'Save Hero' : 'Saved'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">
                    Headline Line 1 (White)
                  </label>
                  <input
                    type="text"
                    value={blocks['homepage_hero']?.title || ''}
                    onChange={(e) => updateField('homepage_hero', 'title', e.target.value)}
                    placeholder="e.g. Cinematic Private Stays."
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">
                    Headline Line 2 (Gradient Text)
                  </label>
                  <input
                    type="text"
                    value={blocks['homepage_hero']?.subtitle || ''}
                    onChange={(e) => updateField('homepage_hero', 'subtitle', e.target.value)}
                    placeholder="e.g. Ultra-Discreet Hospitality."
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">
                  Sub-heading Description
                </label>
                <textarea
                  rows={3}
                  value={blocks['homepage_hero']?.body || ''}
                  onChange={(e) => updateField('homepage_hero', 'body', e.target.value)}
                  placeholder="High-design private sanctuaries featuring..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                />
              </div>

              {/* Live Card Preview */}
              <div className="pt-4 border-t border-white/10">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block mb-2">Live Render Preview</span>
                <div className="p-6 rounded-xl bg-zinc-950/80 border border-white/10 text-center space-y-2">
                  <span className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 text-rose-400 text-xs font-mono font-bold rounded-full">
                    ✨ {blocks['homepage_badge']?.title || "India's Premier Luxury Private Sanctuaries"}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-white">
                    {blocks['homepage_hero']?.title || 'Cinematic Private Stays.'} <br />
                    <span className="bg-gradient-to-r from-rose-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
                      {blocks['homepage_hero']?.subtitle || 'Ultra-Discreet Hospitality.'}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 max-w-xl mx-auto">
                    {blocks['homepage_hero']?.body || 'High-design private sanctuaries...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TRUST HIGHLIGHT CARDS */}
        {activeTab === 'trust' && (
          <div className="space-y-6">
            {[
              { key: 'trust_card_1', defaultTitle: 'Discreet Private Check-In', icon: 'Secret Physical Key' },
              { key: 'trust_card_2', defaultTitle: '100% Private & Verified', icon: 'ID Police Vetting' },
              { key: 'trust_card_3', defaultTitle: 'Aesthetic Cinematic Suites', icon: 'Sensory Design & Bath Soaks' },
            ].map((card, idx) => (
              <div key={card.key} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-accent-gold">Card #{idx + 1} • {card.icon}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{blocks[card.key]?.title || card.defaultTitle}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveBlock(card.key)}
                    disabled={savingKey === card.key || !isBlockDirty(card.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                      isBlockDirty(card.key)
                        ? 'bg-accent-gold hover:bg-white text-black'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingKey === card.key ? 'Saving...' : isBlockDirty(card.key) ? `Save Card #${idx + 1}` : 'Saved'}
                  </button>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">Card Title</label>
                  <input
                    type="text"
                    value={blocks[card.key]?.title || ''}
                    onChange={(e) => updateField(card.key, 'title', e.target.value)}
                    placeholder={card.defaultTitle}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">Card Description</label>
                  <textarea
                    rows={3}
                    value={blocks[card.key]?.body || ''}
                    onChange={(e) => updateField(card.key, 'body', e.target.value)}
                    placeholder="Enter description..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. LIFESTYLE SHOWCASE */}
        {activeTab === 'lifestyle' && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400">Section 3 • Kinkster Banner</span>
                <h3 className="text-base font-bold text-white mt-0.5">Lifestyle Circle Showcase</h3>
              </div>
              <button
                type="button"
                onClick={() => handleSaveBlock('lifestyle_showcase')}
                disabled={savingKey === 'lifestyle_showcase' || !isBlockDirty('lifestyle_showcase')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                  isBlockDirty('lifestyle_showcase')
                    ? 'bg-accent-gold hover:bg-white text-black'
                    : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                {savingKey === 'lifestyle_showcase' ? 'Saving...' : isBlockDirty('lifestyle_showcase') ? 'Save Section' : 'Saved'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">Eyebrow Pill</label>
                <input
                  type="text"
                  value={blocks['lifestyle_showcase']?.subtitle || ''}
                  onChange={(e) => updateField('lifestyle_showcase', 'subtitle', e.target.value)}
                  placeholder="e.g. The Lifestyle Circle • Private Monikers"
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">Headline</label>
                <input
                  type="text"
                  value={blocks['lifestyle_showcase']?.title || ''}
                  onChange={(e) => updateField('lifestyle_showcase', 'title', e.target.value)}
                  placeholder="e.g. Where High Discretion Meets Raw Chemistry."
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">Description Body</label>
              <textarea
                rows={4}
                value={blocks['lifestyle_showcase']?.body || ''}
                onChange={(e) => updateField('lifestyle_showcase', 'body', e.target.value)}
                placeholder="An intimate, confidential society reserved exclusively for verified guests..."
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>
          </div>
        )}

        {/* 4. SANCTUARY PASS SHOWCASE */}
        {activeTab === 'sanctuary' && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Section 4 • Events Banner</span>
                <h3 className="text-base font-bold text-white mt-0.5">Sanctuary Pass Showcase</h3>
              </div>
              <button
                type="button"
                onClick={() => handleSaveBlock('sanctuary_pass_showcase')}
                disabled={savingKey === 'sanctuary_pass_showcase' || !isBlockDirty('sanctuary_pass_showcase')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                  isBlockDirty('sanctuary_pass_showcase')
                    ? 'bg-accent-gold hover:bg-white text-black'
                    : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                {savingKey === 'sanctuary_pass_showcase' ? 'Saving...' : isBlockDirty('sanctuary_pass_showcase') ? 'Save Section' : 'Saved'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">Eyebrow Pill</label>
                <input
                  type="text"
                  value={blocks['sanctuary_pass_showcase']?.subtitle || ''}
                  onChange={(e) => updateField('sanctuary_pass_showcase', 'subtitle', e.target.value)}
                  placeholder="e.g. Exclusive Members Access"
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">Headline</label>
                <input
                  type="text"
                  value={blocks['sanctuary_pass_showcase']?.title || ''}
                  onChange={(e) => updateField('sanctuary_pass_showcase', 'title', e.target.value)}
                  placeholder="e.g. Nothingness Sanctuary Pass"
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 block">Description Body</label>
              <textarea
                rows={4}
                value={blocks['sanctuary_pass_showcase']?.body || ''}
                onChange={(e) => updateField('sanctuary_pass_showcase', 'body', e.target.value)}
                placeholder="Unlock private discussion salons, midnight noir masquerades..."
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
