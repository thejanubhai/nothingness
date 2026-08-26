'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/articles-data';
import { Search, Clock, ArrowRight, Sparkles, Tag, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'All',
  'Dynamics & Kink Culture',
  'Intimacy & Modern Relationships',
  'Sensory Exploration & Space',
  'Discretion & Safe Havens',
];

const FORMAT_FILTERS = [
  { id: 'all', label: 'All Formats' },
  { id: 'story', label: '🕯️ Stories' },
  { id: 'guide', label: '📖 Guides' },
  { id: 'deep-dive', label: '🔬 Deep Dives' },
  { id: 'blog', label: '✍️ Blogs' },
  { id: 'essay', label: '✦ Essays' },
];

interface JournalClientProps {
  initialArticles: Article[];
}

export default function JournalClient({ initialArticles }: JournalClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    return initialArticles.filter((article) => {
      const matchesCategory =
        selectedCategory === 'All' || article.category === selectedCategory;
      const artFormat = (article as any).format || 'essay';
      const matchesFormat =
        selectedFormat === 'all' || artFormat === selectedFormat;
      const matchesSearch =
        searchQuery.trim() === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesCategory && matchesFormat && matchesSearch;
    });
  }, [initialArticles, selectedCategory, selectedFormat, searchQuery]);

  const featuredArticle = useMemo(() => {
    return initialArticles.find((a) => a.featured) || initialArticles[0];
  }, [initialArticles]);

  const nonFeaturedList = useMemo(() => {
    if (selectedCategory !== 'All' || searchQuery.trim() !== '') {
      return filteredArticles;
    }
    return filteredArticles.filter((a) => a.slug !== featuredArticle?.slug);
  }, [filteredArticles, selectedCategory, searchQuery, featuredArticle]);

  return (
    <div className="space-y-16">
      {/* Search & Category Filter Bar */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 p-4 sm:p-6 rounded-3xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? 'bg-accent-gold text-black font-bold shadow-lg shadow-accent-gold/20'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search intimacy, dynamics, shibari..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-accent-gold/50 transition-colors font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Content Format Filter Row */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/5 overflow-x-auto pb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 shrink-0 mr-1">
            Format:
          </span>
          {FORMAT_FILTERS.map((fmt) => {
            const isActive = selectedFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white/20 text-white font-semibold border border-white/30'
                    : 'bg-white/[0.02] text-white/50 hover:text-white border border-white/5'
                }`}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Spotlight (Visible when no specific search is active and on All tab) */}
      {selectedCategory === 'All' && searchQuery.trim() === '' && featuredArticle && (
        <section className="relative group">
          <Link href={`/journal/${featuredArticle.slug}`} className="block">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-accent-gold/40 rounded-3xl p-6 sm:p-10 transition-all duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl pointer-events-none" />

              {/* Left Content */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6 relative z-10">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-gold/10 border border-accent-gold/30 text-accent-gold text-[10px] uppercase font-mono tracking-widest rounded-full font-bold">
                      <Sparkles className="w-3 h-3" />
                      Featured Analysis
                    </span>
                    <span className="text-white/40 text-xs font-mono">
                      {new Date(featuredArticle.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-white/20 text-xs">•</span>
                    <span className="inline-flex items-center gap-1 text-white/50 text-xs font-mono">
                      <Clock className="w-3 h-3" />
                      {featuredArticle.reading_time_minutes} min read
                    </span>
                  </div>

                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white group-hover:text-accent-gold transition-colors duration-300 leading-tight">
                    {featuredArticle.title}
                  </h2>

                  {featuredArticle.subtitle && (
                    <p className="text-accent-gold/80 text-sm font-sans italic">
                      {featuredArticle.subtitle}
                    </p>
                  )}

                  <p className="text-white/60 text-sm sm:text-base leading-relaxed line-clamp-3">
                    {featuredArticle.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-gold/20 border border-accent-gold/40 flex items-center justify-center text-accent-gold font-serif text-xs">
                      NV
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{featuredArticle.author_name}</p>
                      <p className="text-[10px] text-white/40">{featuredArticle.author_role}</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent-gold group-hover:translate-x-1 transition-transform">
                    <span>Read Full Editorial</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Right Image */}
              <div className="lg:col-span-5 relative min-h-[260px] sm:min-h-[340px] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
                <Image
                  src={featuredArticle.cover_image}
                  alt={featuredArticle.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5">
                  {featuredArticle.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Grid of Articles */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="font-serif text-2xl text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent-gold" />
            {selectedCategory === 'All' && searchQuery === ''
              ? 'Latest Articles & Research'
              : `Articles in ${selectedCategory} (${filteredArticles.length})`}
          </h3>
          <span className="text-xs font-mono text-white/40">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'Article' : 'Articles'}
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-24 bg-white/[0.01] border border-white/5 rounded-3xl p-8 space-y-4">
            <p className="text-white/40 text-sm">No articles matched your search filter.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="bg-accent-gold text-black px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {nonFeaturedList.map((article) => (
                <motion.article
                  key={article.slug}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="group flex flex-col justify-between bg-white/[0.02] border border-white/5 hover:border-accent-gold/40 rounded-3xl overflow-hidden p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-accent-gold/5"
                >
                  <Link href={`/journal/${article.slug}`} className="block space-y-4">
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
                      <Image
                        src={article.cover_image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-100"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-mono uppercase tracking-widest text-accent-gold font-bold">
                          {article.category}
                        </span>
                        {((article as any).format || 'essay') !== 'essay' && (
                          <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[8px] font-mono uppercase tracking-wider text-white">
                            {(article as any).format === 'guide' ? 'Guide' : (article as any).format === 'story' ? 'Story' : (article as any).format === 'blog' ? 'Blog' : 'Deep Dive'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Header */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                      <span>
                        {new Date(article.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-accent-gold/70" />
                        {article.reading_time_minutes} min
                      </span>
                    </div>

                    {/* Title & Excerpt */}
                    <div className="space-y-2">
                      <h4 className="font-serif text-xl sm:text-2xl text-white group-hover:text-accent-gold transition-colors duration-300 line-clamp-2 leading-snug">
                        {article.title}
                      </h4>
                      <p className="text-white/60 text-xs leading-relaxed line-clamp-3 font-sans">
                        {article.excerpt}
                      </p>
                    </div>
                  </Link>

                  {/* Footer Bar with Tags and Link */}
                  <div className="pt-4 mt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-hidden max-w-[65%]">
                      <Tag className="w-3 h-3 text-white/30 shrink-0" />
                      <span className="text-[10px] font-mono text-white/40 truncate">
                        {article.tags.slice(0, 2).join(', ')}
                      </span>
                    </div>

                    <Link
                      href={`/journal/${article.slug}`}
                      className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-accent-gold group-hover:translate-x-1 transition-transform shrink-0"
                    >
                      <span>Read</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
