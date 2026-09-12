'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/articles-data';
import { 
  BookOpen, Plus, Edit, Trash2, ExternalLink, Search, 
  Sparkles, Eye, Clock, Calendar, CheckCircle2, AlertCircle,
  Lightbulb, ArrowRight, Wand2, Loader2, RefreshCw, X, Check,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { 
  deleteArticle,
  generateArticleCoverImageAction,
  generateAllArticleCoverImagesAction 
} from '@/app/actions/journal';

interface AdminJournalClientProps {
  initialArticles: Article[];
}

export default function AdminJournalClient({ initialArticles }: AdminJournalClientProps) {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // AI Contextual Image Generator States
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatusMessage, setBatchStatusMessage] = useState('');
  const [batchLogs, setBatchLogs] = useState<Array<{ slug: string; title: string; success: boolean; cover_image?: string; error?: string }>>([]);
  const [generatingSlug, setGeneratingSlug] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; category?: string } | null>(null);

  const contextualCount = articles.filter((a) => a.cover_image?.includes('/images/journal/')).length;
  const roomImageCount = articles.length - contextualCount;

  const handleRunBatch = async (options: { onlyRoomImages?: boolean; forceRegenerate?: boolean } = {}) => {
    setBatchProcessing(true);
    setBatchProgress(15);
    setBatchStatusMessage('Analyzing article catalog and visual directives...');
    setBatchLogs([]);

    try {
      toast.info('Starting Contextual Image Engine (35mm Leica film aesthetic)...');
      setBatchProgress(40);
      setBatchStatusMessage('Applying bespoke editorial photography directives...');

      const res = await generateAllArticleCoverImagesAction(options);
      setBatchProgress(90);

      if (res.success) {
        setBatchLogs(res.details || []);
        setBatchProgress(100);
        setBatchStatusMessage(`Completed: ${res.updated} article cover images synchronized!`);
        toast.success(`Generated/Synced ${res.updated} contextual article images!`);

        if (res.details && res.details.length > 0) {
          const coverMap = new Map(res.details.map((d) => [d.slug, d.cover_image]));
          setArticles((prev) =>
            prev.map((a) => {
              const newCover = coverMap.get(a.slug);
              return newCover ? { ...a, cover_image: newCover } : a;
            })
          );
        }
        router.refresh();
      } else {
        toast.error('Batch generation failed');
        setBatchStatusMessage('Generation encountered an issue.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error running batch generation');
      setBatchStatusMessage(err.message || 'Failed to complete.');
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleRegenerateSingle = async (article: Article) => {
    setGeneratingSlug(article.slug);
    try {
      toast.info(`Generating contextual cover for "${article.title.slice(0, 30)}..."`);
      const res = await generateArticleCoverImageAction(article.slug);
      if (res.success && res.cover_image) {
        toast.success(`Context cover generated for "${article.title.slice(0, 25)}..."`);
        setArticles((prev) =>
          prev.map((a) => (a.slug === article.slug ? { ...a, cover_image: res.cover_image! } : a))
        );
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to generate image');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error generating image');
    } finally {
      setGeneratingSlug(null);
    }
  };

  const filtered = articles.filter((a) => {
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) ||
      a.author_name.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeletingId(id);
    try {
      const res = await deleteArticle(id);
      if (res.success) {
        toast.success('Article Deleted');
        setArticles(articles.filter((a) => a.id !== id));
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete article');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting article');
    } finally {
      setDeletingId(null);
    }
  };

  const aiTopics = [
    {
      title: "Navigating Power Dynamics in Modern Indian Relationships: Beyond the Taboo",
      category: "Dynamics & Kink Culture",
      intent: "Educational deep-dive into D/s dynamics, safe words, and unlearning patriarchal myths",
      tags: ["Power Dynamics", "BDSM India", "Consent Culture"]
    },
    {
      title: "The Art of Aftercare: Why Indian Couples Often Skip It and Why It Matters",
      category: "Intimacy & Modern Relationships",
      intent: "Psychological and neurochemical recovery after intense sensory intimacy",
      tags: ["Aftercare", "Emotional Hygiene", "Intimacy"]
    },
    {
      title: "Sensory Deprivation and Overload: Designing Rooms for Altered States of Intimacy",
      category: "Sensory Exploration & Space",
      intent: "Thermal contrast, blindfolds, acoustic calibration, and somatic release",
      tags: ["Sensory Play", "Dark Aesthetics", "Atmosphere"]
    },
    {
      title: "Privacy in the Metropolis: The Psychological Toll of Living Under Constant Surveillance",
      category: "Discretion & Safe Havens",
      intent: "Navigating joint families, society guards, and the biological need for private sanctuaries",
      tags: ["Privacy Rights", "Urban Living", "Safe Spaces"]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-white">Editorial Journal Engine</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-accent-gold/10 border border-accent-gold/30 text-accent-gold text-xs font-mono">
              {articles.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Manage India-targeted essays on alternate lifestyle, relationship dynamics, kink safety, sensory exploration, and private sanctuaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 hover:from-amber-500/30 hover:via-purple-500/30 hover:to-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-mono font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/10 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Generate AI Context Images</span>
            {roomImageCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-mono font-bold">
                {roomImageCount} pending
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                All Contextual
              </span>
            )}
          </button>

          <Link
            href="/journal"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Journal</span>
          </Link>

          <Link
            href="/admin/journal/new"
            className="px-4 py-2.5 rounded-xl bg-accent-gold hover:bg-white text-black text-xs font-bold font-mono tracking-wider uppercase flex items-center gap-2 transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </Link>
        </div>
      </div>

      {/* AI Topic Generator & Advisor Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/20 via-zinc-900/40 to-black border border-purple-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="font-serif text-lg text-white font-semibold">Lifestyle &amp; Intimacy Topic Engine (India Targeted)</h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              High-Intent Topics
            </span>
          </div>

          <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
            Curated relationship dynamics, kink safety frameworks, sensory design, and privacy guides for urban Indian couples and lifestyle practitioners. Click any topic to initialize a draft.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {aiTopics.map((topic, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider">
                    {topic.category}
                  </span>
                  <h4 className="text-xs font-serif text-white font-medium group-hover:text-purple-300 transition-colors mt-0.5">
                    {topic.title}
                  </h4>
                  <p className="text-[10px] text-white/40 mt-1 font-sans">
                    {topic.intent}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-white/30">
                    #{topic.tags[0]}
                  </span>
                  <Link
                    href={`/admin/journal/new?title=${encodeURIComponent(topic.title)}&category=${encodeURIComponent(topic.category)}&tags=${encodeURIComponent(topic.tags.join(','))}`}
                    className="text-[10px] font-mono uppercase tracking-wider text-accent-gold group-hover:underline flex items-center gap-1"
                  >
                    <span>Use Topic</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, slug, or author..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-accent-gold/50 transition-colors font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'Dynamics & Kink Culture', 'Intimacy & Modern Relationships', 'Sensory Exploration & Space', 'Discretion & Safe Havens'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-white/15 text-white font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Article</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Published</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Reads / Views</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 font-mono">
                    No articles found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((article) => (
                  <tr key={article.slug} className="hover:bg-zinc-900/30 transition-colors">
                    {/* Article Title & Cover */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3.5 min-w-[280px] max-w-[380px]">
                        <div 
                          onClick={() => setPreviewImage({ url: article.cover_image, title: article.title, category: article.category })}
                          className="relative w-14 h-10 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800 cursor-pointer group/thumb hover:border-amber-500/50 transition-all shadow"
                          title="Click to preview 35mm editorial image"
                        >
                          <Image
                            src={article.cover_image}
                            alt={article.title}
                            fill
                            className="object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                          />
                          {article.cover_image?.includes('/images/journal/') ? (
                            <span 
                              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black"
                              title="Active Contextual Editorial Image" 
                            />
                          ) : (
                            <span 
                              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-black animate-ping"
                              title="Room photo - context generation recommended" 
                            />
                          )}
                        </div>
                        <div className="truncate space-y-0.5">
                          <p className="font-serif text-sm text-white font-medium truncate">
                            {article.title}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-500 truncate">
                            /journal/{article.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/70">
                        {article.category}
                      </span>
                    </td>

                    {/* Published Date */}
                    <td className="py-4 px-4 whitespace-nowrap font-mono text-zinc-400 text-[11px]">
                      {new Date(article.published_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${
                          article.status === 'published'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {article.status}
                      </span>
                    </td>

                    {/* Views */}
                    <td className="py-4 px-4 whitespace-nowrap font-mono text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{article.view_count || 120} views</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick AI Cover Regenerate Button */}
                        <button
                          onClick={() => handleRegenerateSingle(article)}
                          disabled={generatingSlug === article.slug}
                          className="p-2 rounded-lg bg-zinc-900 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Generate/Refresh Contextual AI Cover"
                        >
                          {generatingSlug === article.slug ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                          ) : (
                            <Wand2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <Link
                          href={`/journal/${article.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="View Live"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href={`/admin/journal/${article.id || article.slug}`}
                          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-accent-gold hover:text-white transition-colors"
                          title="Edit Article"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>

                        {article.id && (
                          <button
                            onClick={() => handleDelete(article.id!, article.title)}
                            disabled={deletingId === article.id}
                            className="p-2 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Delete Article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch AI Contextual Image Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800/80 flex items-start justify-between bg-gradient-to-r from-purple-950/20 via-zinc-900/40 to-black">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-serif font-bold text-white">AI Editorial Context Image Engine</h2>
                </div>
                <p className="text-xs text-white/50">
                  Strict Anti-AI Realism • 35mm Leica M11 Film Aesthetic • Chiaroscuro &amp; Brutalism
                </p>
              </div>
              <button
                onClick={() => !batchProcessing && setIsBatchModalOpen(false)}
                disabled={batchProcessing}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Directive Explainer */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-mono text-[11px] font-semibold uppercase tracking-wider">
                  <span>Photography &amp; Aesthetic Directives</span>
                </div>
                <p className="text-white/70 leading-relaxed">
                  Generates cinematic, tactile, 35mm film editorial imagery tailored specifically to the subject matter of each essay (e.g. Shibari jute ropes, amber 2200K sanctuary glows, acoustic wool, digital privacy hardware). Strictly prohibits plastic CGI, surrealism, or robotic AI faces.
                </p>
              </div>

              {/* Status Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Total Articles</span>
                  <p className="text-xl font-mono font-bold text-white">{articles.length}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">Contextual Covers</span>
                  <p className="text-xl font-mono font-bold text-emerald-300">{contextualCount}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-1">
                  <span className="text-[10px] font-mono text-amber-400 uppercase">Room Photos</span>
                  <p className="text-xl font-mono font-bold text-amber-300">{roomImageCount}</p>
                </div>
              </div>

              {/* Progress and status message */}
              {batchProcessing && (
                <div className="space-y-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-amber-300 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      {batchStatusMessage}
                    </span>
                    <span className="text-white/60">{batchProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-purple-500 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${batchProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => handleRunBatch({ onlyRoomImages: false })}
                  disabled={batchProcessing}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {batchProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Sync / Generate All ({articles.length})</span>
                </button>

                {roomImageCount > 0 && (
                  <button
                    onClick={() => handleRunBatch({ onlyRoomImages: true })}
                    disabled={batchProcessing}
                    className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border border-zinc-700"
                  >
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    <span>Fix Room Photos ({roomImageCount})</span>
                  </button>
                )}

                <button
                  onClick={() => handleRunBatch({ forceRegenerate: true })}
                  disabled={batchProcessing}
                  className="py-3 px-4 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 font-mono font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border border-purple-500/30"
                  title="Forces brand-new AI generation using Imagen 3 / FLUX"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Force Re-render AI</span>
                </button>
              </div>

              {/* Completed Log List */}
              {batchLogs.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>Engine Activity Log</span>
                    <span>{batchLogs.length} Processed</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-black/40 border border-zinc-900 font-mono text-[11px]">
                    {batchLogs.map((log) => (
                      <div
                        key={log.slug}
                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/60"
                      >
                        <div className="flex items-center gap-2.5 truncate max-w-[400px]">
                          {log.cover_image && (
                            <div className="relative w-7 h-5 rounded overflow-hidden bg-zinc-800 shrink-0">
                              <Image src={log.cover_image} alt={log.title} fill className="object-cover" />
                            </div>
                          )}
                          <span className="truncate text-white/90">{log.title}</span>
                        </div>
                        {log.success ? (
                          <span className="text-emerald-400 flex items-center gap-1 shrink-0 text-[10px]">
                            <Check className="w-3 h-3" /> Ready
                          </span>
                        ) : (
                          <span className="text-red-400 shrink-0 text-[10px]">{log.error || 'Failed'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 flex justify-end">
              <button
                onClick={() => setIsBatchModalOpen(false)}
                disabled={batchProcessing}
                className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl cursor-default"
          >
            <div className="relative aspect-video w-full bg-black">
              <Image
                src={previewImage.url}
                alt={previewImage.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-5 flex items-center justify-between border-t border-zinc-900">
              <div className="space-y-1">
                {previewImage.category && (
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                    {previewImage.category}
                  </span>
                )}
                <h3 className="font-serif text-base text-white font-semibold">
                  {previewImage.title}
                </h3>
                <p className="text-[11px] font-mono text-zinc-500">
                  {previewImage.url}
                </p>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
