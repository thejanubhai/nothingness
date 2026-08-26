import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getArticleBySlug, getPublishedArticles, incrementArticleViews } from '@/app/actions/journal';
import { SEED_ARTICLES } from '@/lib/articles-data';
import JsonLd, { generateArticleSchema, generateBreadcrumbSchema } from '@/components/JsonLd';
import { ArrowLeft, Clock, Calendar, Tag, Share2, Sparkles, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return SEED_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found | Nothingness Journal',
    };
  }

  const title = article.meta_title || `${article.title} | Nothingness Journal`;
  const description = article.meta_description || article.excerpt;
  const canonicalUrl = `https://nothingness.asia/journal/${article.slug}`;

  return {
    title,
    description,
    keywords: article.meta_keywords || article.tags,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: article.published_at,
      authors: [article.author_name],
      tags: article.tags,
      images: [
        {
          url: article.cover_image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      locale: 'en_IN',
      siteName: 'Nothingness',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [article.cover_image],
    },
  };
}

// Simple Markdown parser for article body
function renderMarkdownContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-6 space-y-3 pl-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start text-white/70 text-base sm:text-lg leading-relaxed">
              <span className="text-accent-gold mr-3 mt-1.5 text-xs">✦</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const formatInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-accent-gold/90 not-italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-white/10 text-accent-gold px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('* ') || line.startsWith('- ')) {
      inList = true;
      listItems.push(line.substring(2));
      continue;
    } else if (line.match(/^\d+\.\s/)) {
      inList = true;
      listItems.push(line.replace(/^\d+\.\s/, ''));
      continue;
    } else {
      flushList();
    }

    if (!line) {
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="font-serif text-xl sm:text-2xl text-white mt-8 mb-4">
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="font-serif text-2xl sm:text-3xl md:text-4xl text-white mt-12 mb-6 border-b border-white/5 pb-3">
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="font-serif text-3xl sm:text-5xl text-white mt-12 mb-6">
          {line.replace('# ', '')}
        </h1>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="my-8 pl-6 border-l-2 border-accent-gold bg-white/[0.02] p-4 rounded-r-2xl italic text-white/80 text-base sm:text-lg">
          <p dangerouslySetInnerHTML={{ __html: formatInline(line.replace('> ', '')) }} />
        </blockquote>
      );
    } else {
      elements.push(
        <p
          key={i}
          className="my-5 text-white/70 text-base sm:text-lg leading-[1.85] font-sans font-light"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
  }

  flushList();
  return elements;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Increment views
  incrementArticleViews(slug);

  const allArticles = await getPublishedArticles();
  const relatedArticles = allArticles
    .filter((a) => a.slug !== article.slug && (a.category === article.category || a.tags.some(t => article.tags.includes(t))))
    .slice(0, 3);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Journal', url: '/journal' },
    { name: article.title, url: `/journal/${article.slug}` },
  ];

  return (
    <article className="min-h-screen pt-32 sm:pt-36 pb-24 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
      {/* Schema Structured Data */}
      <JsonLd data={generateArticleSchema(article)} id="article-schema" />
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="article-breadcrumb-schema" />

      {/* Back Navigation Link */}
      <div className="mb-8">
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50 hover:text-accent-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Editorial Journal</span>
        </Link>
      </div>

      {/* Article Header */}
      <header className="space-y-6 border-b border-white/10 pb-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/30 text-accent-gold text-[10px] font-mono uppercase tracking-widest font-bold">
            {article.category}
          </span>
          <span className="flex items-center gap-1.5 text-white/40 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(article.published_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="text-white/20 text-xs">•</span>
          <span className="flex items-center gap-1.5 text-white/40 text-xs font-mono">
            <Clock className="w-3.5 h-3.5" />
            {article.reading_time_minutes} min read
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.12]">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-base sm:text-xl text-accent-gold/80 italic font-serif leading-relaxed">
            {article.subtitle}
          </p>
        )}

        {/* Author Bio Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-gold/20 border border-accent-gold/40 flex items-center justify-center text-accent-gold font-serif text-sm">
              {article.author_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{article.author_name}</p>
              <p className="text-xs text-white/40">{article.author_role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 hidden sm:inline">
              Pan-India Research
            </span>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="my-10 relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl">
        <Image
          src={article.cover_image}
          alt={article.title}
          fill
          className="object-cover"
          sizes="(max-width: 896px) 100vw, 896px"
          priority
        />
      </div>

      {/* Excerpt Lead Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/10 mb-12">
        <p className="text-white/80 text-base sm:text-lg italic leading-relaxed font-sans">
          "{article.excerpt}"
        </p>
      </div>

      {/* Article Body Content */}
      <div className="prose prose-invert max-w-none">
        {renderMarkdownContent(article.content)}
      </div>

      {/* Tags Section */}
      <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center gap-2">
        <Tag className="w-4 h-4 text-accent-gold mr-1" />
        {article.tags.map((tag, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/70"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Author Bio Box */}
      <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-accent-gold/20 border border-accent-gold/40 flex items-center justify-center text-accent-gold font-serif text-2xl shrink-0">
          {article.author_name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-mono tracking-widest text-accent-gold">About the Author</p>
          <h4 className="font-serif text-xl text-white font-semibold">{article.author_name}</h4>
          <p className="text-xs text-white/60 leading-relaxed font-sans">
            Curator of strategic growth, search intelligence, and spatial acoustics at Nothingness. Specializes in generative AI retrieval architectures, brutalist interior psychology, and private hospitality frameworks.
          </p>
        </div>
      </div>

      {/* Related Articles Section */}
      {relatedArticles.length > 0 && (
        <div className="mt-20 pt-12 border-t border-white/10 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl sm:text-3xl text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent-gold" />
              Related Editorial Research
            </h3>
            <Link
              href="/journal"
              className="text-xs font-mono uppercase tracking-wider text-accent-gold hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.slug}
                href={`/journal/${rel.slug}`}
                className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent-gold/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
                    <Image
                      src={rel.cover_image}
                      alt={rel.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-accent-gold">
                    {rel.category}
                  </span>
                  <h4 className="font-serif text-base text-white group-hover:text-accent-gold transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                </div>
                <div className="pt-3 mt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
                  <span>{rel.reading_time_minutes} min read</span>
                  <span className="text-accent-gold group-hover:translate-x-1 transition-transform">Read →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
