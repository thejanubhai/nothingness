'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/articles-data';
import { 
  BookOpen, Plus, Edit, Trash2, ExternalLink, Search, 
  Sparkles, Eye, Clock, Calendar, CheckCircle2, AlertCircle,
  Lightbulb, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { deleteArticle } from '@/app/actions/journal';

interface AdminJournalClientProps {
  initialArticles: Article[];
}

export default function AdminJournalClient({ initialArticles }: AdminJournalClientProps) {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      title: "Generative Engine Optimization (GEO) for Indian Luxury Hospitality",
      category: "AI & Search Strategy",
      intent: "High-ticket direct bookings via Perplexity & Google AI Overviews",
      tags: ["AI SEO", "Generative Search", "Delhi NCR Stays"]
    },
    {
      title: "The Architecture of Acoustic Isolation: Decoupled Walls & 55dB STC Ratings",
      category: "Architecture & Atmosphere",
      intent: "Architectural and luxury branding authority",
      tags: ["Acoustics", "Brutalism", "Sensory Privacy"]
    },
    {
      title: "Autonomous Keyless Hospitality & Delhi Police Digital Compliance",
      category: "Discreet Hospitality",
      intent: "Trust, safety, legal compliance and guest discretion",
      tags: ["Autonomous Check-in", "Police Compliance", "ID Verification"]
    },
    {
      title: "The Unit Economics of Niche Sanctuaries: 3x Outperformance vs Long-Term Rent",
      category: "Real Estate & Growth",
      intent: "Franchise and host partner acquisition",
      tags: ["Real Estate Yield", "Franchise ROI", "South Delhi"]
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
            Manage India-targeted essays, AI SEO publications, Generative Engine Optimization topics, and metadata.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
              <h3 className="font-serif text-lg text-white font-semibold">AI SEO Topic Engine (India High-Intent)</h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              Live Search Trends
            </span>
          </div>

          <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
            Recommended high-opportunity topics curated for Perplexity, Google SGE / AI Overviews, and high-ticket Indian staycation searches. Click any topic to initialize a draft with optimized tags and structure.
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
          {['all', 'AI & Search Strategy', 'Architecture & Atmosphere', 'Discreet Hospitality', 'Real Estate & Growth'].map((cat) => (
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
                        <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                          <Image
                            src={article.cover_image}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
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
    </div>
  );
}
