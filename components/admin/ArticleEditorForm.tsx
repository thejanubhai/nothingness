'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/articles-data';
import { createArticle, updateArticle, generateArticleWithAI } from '@/app/actions/journal';
import { 
  ArrowLeft, Save, Sparkles, Image as ImageIcon, Tag, 
  Clock, Eye, FileText, CheckCircle2, AlertCircle, Loader2,
  Wand2, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

interface ArticleEditorFormProps {
  initialData?: Partial<Article>;
  isNew?: boolean;
}

const CATEGORIES = [
  'AI & Search Strategy',
  'Architecture & Atmosphere',
  'Discreet Hospitality',
  'Real Estate & Growth',
];

const PRESET_TOPICS = [
  "Generative Engine Optimization (GEO) for Indian Luxury Hospitality",
  "The Architecture of Acoustic Isolation: Decoupled Walls & 55dB STC Ratings",
  "Autonomous Keyless Hospitality & Delhi Police Digital Compliance",
  "The Unit Economics of Niche Sanctuaries: 3x Outperformance vs Long-Term Rent",
  "Entity SEO Mastery: How AI Knowledge Graphs Classify Boutique Accommodations",
  "Psychology of Monolithic Brutalism in Modern Indian Suites",
  "Local Search Dominance for Delhi NCR & Gurgaon Staycations",
  "Discreet Luxury Travel: Managing Privacy and Frictionless Access"
];

export default function ArticleEditorForm({ initialData = {}, isNew = false }: ArticleEditorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState(initialData.title || '');
  const [customInstructions, setCustomInstructions] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'preview'>('content');

  // Form State
  const [title, setTitle] = useState(initialData.title || '');
  const [slug, setSlug] = useState(initialData.slug || '');
  const [subtitle, setSubtitle] = useState(initialData.subtitle || '');
  const [excerpt, setExcerpt] = useState(initialData.excerpt || '');
  const [content, setContent] = useState(initialData.content || '');
  const [coverImage, setCoverImage] = useState(initialData.cover_image || '/images/The Void (1).png');
  const [category, setCategory] = useState(initialData.category || 'AI & Search Strategy');
  const [tagsInput, setTagsInput] = useState(initialData.tags?.join(', ') || 'AI SEO, Hospitality');
  const [authorName, setAuthorName] = useState(initialData.author_name || 'Kabir Varma');
  const [authorRole, setAuthorRole] = useState(initialData.author_role || 'Chief Strategy Architect');
  const [status, setStatus] = useState(initialData.status || 'published');
  const [featured, setFeatured] = useState(initialData.featured ?? false);
  const [readingTime, setReadingTime] = useState(initialData.reading_time_minutes || 7);
  const [publishedAt, setPublishedAt] = useState(
    initialData.published_at ? new Date(initialData.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );

  // SEO fields
  const [metaTitle, setMetaTitle] = useState(initialData.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(initialData.meta_description || '');
  const [metaKeywordsInput, setMetaKeywordsInput] = useState(initialData.meta_keywords?.join(', ') || '');

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (isNew) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
      if (!metaTitle) setMetaTitle(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict validation: check for em dashes
    const allText = `${title} ${subtitle} ${excerpt} ${content} ${metaTitle} ${metaDescription}`;
    if (/[\u2014\u2013\u2015]/.test(allText)) {
      toast.error('Em dashes (— or –) are strictly prohibited per brand guidelines. Please replace with colons, commas, or parentheses.');
      return;
    }

    setLoading(true);

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const metaKeywords = metaKeywordsInput.split(',').map((t) => t.trim()).filter(Boolean);

    const payload: Partial<Article> = {
      title,
      slug,
      subtitle,
      excerpt,
      content,
      cover_image: coverImage,
      category: category as any,
      tags,
      author_name: authorName,
      author_role: authorRole,
      status: status as any,
      featured,
      reading_time_minutes: Number(readingTime) || 5,
      published_at: new Date(publishedAt).toISOString(),
      meta_title: metaTitle || title,
      meta_description: metaDescription || excerpt,
      meta_keywords: metaKeywords,
    };

    try {
      if (isNew) {
        const res = await createArticle(payload);
        if (res.success) {
          toast.success('Article Created Successfully');
          router.push('/admin/journal');
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to create article');
        }
      } else if (initialData.id) {
        const res = await updateArticle(initialData.id, payload);
        if (res.success) {
          toast.success('Article Updated Successfully');
          router.push('/admin/journal');
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to update article');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async (topicToUse?: string) => {
    const topic = topicToUse || aiTopicInput || title;
    if (!topic) {
      toast.error('Please enter or select a topic to generate');
      return;
    }

    setGenerating(true);
    const toastId = toast.loading('Generating Human-Toned Article (Zero Em Dashes, GEO Optimized)...');

    try {
      const res = await generateArticleWithAI({
        topic,
        category,
        customPrompt: customInstructions,
      });

      if (res.success && res.article) {
        const art = res.article;
        setTitle(art.title || topic);
        setSlug(art.slug || '');
        setSubtitle(art.subtitle || '');
        setExcerpt(art.excerpt || '');
        setContent(art.content || '');
        if (art.category) setCategory(art.category as any);
        if (art.tags) setTagsInput(art.tags.join(', '));
        if (art.reading_time_minutes) setReadingTime(art.reading_time_minutes);
        if (art.meta_title) setMetaTitle(art.meta_title);
        if (art.meta_description) setMetaDescription(art.meta_description);
        if (art.meta_keywords) setMetaKeywordsInput(art.meta_keywords.join(', '));

        toast.success('Article Generated Successfully! All fields auto-populated.', { id: toastId });
      } else {
        toast.error(res.error || 'Failed to generate article', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Unexpected error during generation', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/journal"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-white">
              {isNew ? 'Create New Editorial Essay' : 'Edit Article'}
            </h1>
            <p className="text-xs text-white/50">
              {isNew ? 'Draft and publish India-targeted SEO & AI SEO content' : `Editing /journal/${slug}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/journal')}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || generating}
            className="px-6 py-2.5 rounded-xl bg-accent-gold hover:bg-white text-black font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : isNew ? 'Publish Article' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* ⚡ AI AUTO-GENERATOR BAR */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-zinc-900/60 to-black border border-accent-gold/30 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent-gold/20 border border-accent-gold/40 flex items-center justify-center text-accent-gold">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base text-white font-semibold flex items-center gap-2">
                <span>AI Article Auto-Generator Engine</span>
                <span className="text-[10px] font-mono uppercase tracking-wider bg-accent-gold/20 text-accent-gold px-2 py-0.5 rounded-full border border-accent-gold/30">
                  Strict Rule Guardrails Active
                </span>
              </h3>
              <p className="text-[11px] text-white/50 font-sans">
                Generates complete human-toned articles with zero em dashes, authentic Indian metro context, H2/H3 sections, excerpt, and full SEO metadata.
              </p>
            </div>
          </div>
        </div>

        {/* Input & Generator Actions */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={aiTopicInput}
              onChange={(e) => setAiTopicInput(e.target.value)}
              placeholder="Enter any topic (e.g. Acoustic Isolation in South Delhi Boutique Sanctuaries)"
              className="w-full bg-zinc-900/90 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white placeholder:text-zinc-500 font-serif focus:outline-none focus:border-accent-gold"
            />

            <button
              type="button"
              onClick={() => handleAIGenerate()}
              disabled={generating}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-accent-gold hover:bg-white text-black font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 shadow-xl disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Draft...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-Generate Full Draft</span>
                </>
              )}
            </button>
          </div>

          {/* Quick preset suggestions */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
              Or pick a trending high-intent India topic:
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESET_TOPICS.slice(0, 4).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiTopicInput(preset);
                    handleAIGenerate(preset);
                  }}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-accent-gold/20 border border-white/10 hover:border-accent-gold/40 text-[11px] text-white/70 hover:text-white transition-all text-left truncate max-w-xs"
                  title={preset}
                >
                  ⚡ {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === 'content'
              ? 'bg-accent-gold text-black shadow-lg shadow-accent-gold/20'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Core Content</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === 'seo'
              ? 'bg-accent-gold text-black shadow-lg shadow-accent-gold/20'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI SEO &amp; Meta Tags</span>
        </button>
      </div>

      {/* TAB 1: CORE CONTENT */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Title & Slug Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-950 border border-zinc-900 p-6 rounded-3xl">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Article Title (H1) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. Generative Engine Optimization in India: How AI Overviews Index Brands"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-serif focus:outline-none focus:border-accent-gold/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="generative-engine-optimization-india"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 font-mono focus:outline-none focus:border-accent-gold/50"
              />
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Subtitle / Thesis Hook
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Moving beyond legacy keywords to win top citations in AI search snapshots"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>
          </div>

          {/* Excerpt Lead Box */}
          <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Editorial Excerpt / Lead Paragraph *
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                {excerpt.length}/300 chars
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="High-density summary that explains the key takeaways without fluff..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed focus:outline-none focus:border-accent-gold/50 resize-none font-sans"
            />
          </div>

          {/* Markdown Content Editor */}
          <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-accent-gold" />
                <span>Full Markdown Body (Zero Em Dashes, Natural Human Tone) *</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                Supports ## Headings, lists, quotes
              </span>
            </div>
            <textarea
              required
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write in-depth markdown content here. Use ## for section headings, * for bullet lists, > for blockquotes..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-200 leading-relaxed font-mono focus:outline-none focus:border-accent-gold/50 resize-y"
            />
          </div>

          {/* Metadata & Media Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-950 border border-zinc-900 p-6 rounded-3xl">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-gold/50 cursor-pointer font-mono"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-black text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Publish Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-gold/50 cursor-pointer font-mono"
              >
                <option value="published" className="bg-black text-white">Published</option>
                <option value="draft" className="bg-black text-white">Draft</option>
                <option value="archived" className="bg-black text-white">Archived</option>
              </select>
            </div>

            {/* Estimated Read Time */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Estimated Reading Time (Mins)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={readingTime}
                onChange={(e) => setReadingTime(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-accent-gold/50"
              />
            </div>

            {/* Cover Image URL */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Cover Image URL / Path *
              </label>
              <input
                type="text"
                required
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="/images/The Void (1).png"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 font-mono focus:outline-none focus:border-accent-gold/50"
              />
            </div>

            {/* Publication Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Publication Timestamp
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-accent-gold/50"
              />
            </div>

            {/* Tags Input */}
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Article Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="AI SEO, Generative Engine Optimization, Delhi NCR Stays"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 font-mono focus:outline-none focus:border-accent-gold/50"
              />
            </div>

            {/* Author Details */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Author Title / Role
              </label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>

            {/* Featured Switch */}
            <div className="md:col-span-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded accent-accent-gold"
                />
                <span className="text-xs text-white font-mono">
                  Set as Featured Hero Spotlight on Editorial Journal Hub
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SEO & METADATA */}
      {activeTab === 'seo' && (
        <div className="space-y-6 bg-zinc-950 border border-zinc-900 p-6 sm:p-8 rounded-3xl">
          <div className="space-y-1">
            <h3 className="font-serif text-lg text-white">Search Engine &amp; AI Retrieval Optimization</h3>
            <p className="text-xs text-white/50">
              Customize title tags, OpenGraph descriptions, and schema entities for maximum search indexing.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-900">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  Custom Meta Title Tag
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  {metaTitle.length}/60 chars (Recommended)
                </span>
              </div>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Generative Engine Optimization (GEO) in India | AI SEO Guide"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-accent-gold/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  Custom Meta Description
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  {metaDescription.length}/160 chars
                </span>
              </div>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Concise description tailored for Google snippets and Perplexity citation summaries..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 font-mono focus:outline-none focus:border-accent-gold/50 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Target Meta Keywords (comma separated)
              </label>
              <input
                type="text"
                value={metaKeywordsInput}
                onChange={(e) => setMetaKeywordsInput(e.target.value)}
                placeholder="generative engine optimization india, ai seo delhi, luxury staycation seo"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 font-mono focus:outline-none focus:border-accent-gold/50"
              />
            </div>

            {/* Google Search Result Mockup Preview */}
            <div className="pt-6 border-t border-zinc-900 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-accent-gold">
                Google Search Result Snippet Preview
              </p>
              <div className="p-4 rounded-2xl bg-black border border-zinc-800 space-y-1">
                <p className="text-[11px] font-mono text-zinc-400 truncate">
                  https://nothingness.asia &gt; journal &gt; {slug || 'article-slug'}
                </p>
                <h4 className="text-sm font-sans text-blue-400 hover:underline cursor-pointer font-medium line-clamp-1">
                  {metaTitle || title || 'Article Title'}
                </h4>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {metaDescription || excerpt || 'Article excerpt and description will appear here on Google and generative search results...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
