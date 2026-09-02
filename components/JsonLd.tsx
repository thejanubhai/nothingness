import React from 'react';

interface JsonLdProps {
  data: Record<string, any>;
  id?: string;
}

export default function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      id={id || 'json-ld-schema'}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://nothingness.asia/#organization',
    name: 'Nothingness',
    legalName: 'Nothingness Inc.',
    url: 'https://nothingness.asia',
    logo: 'https://nothingness.asia/images/logo.png',
    image: 'https://nothingness.asia/images/IMG_9955.jpg',
    description: "India's Premier Alternate Lifestyle & Luxury Sanctuary Brand. Ultra-discreet, design-forward private sanctuaries with acoustic privacy across Delhi NCR and India.",
    email: 'concierge@nothingness.asia',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'New Delhi',
      addressRegion: 'Delhi NCR',
      addressCountry: 'IN'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '28.6139',
      longitude: '77.2090'
    },
    sameAs: [
      'https://instagram.com/nothingnessog'
    ],
    knowsAbout: [
      'Alternate Lifestyle Hospitality',
      'Brutalist Architecture',
      'Discreet Private Stays',
      'Acoustic Soundproofing',
      'Luxury Private Stays Delhi NCR'
    ]
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://nothingness.asia/#website',
    url: 'https://nothingness.asia',
    name: 'Nothingness | A State of Mind',
    publisher: {
      '@id': 'https://nothingness.asia/#organization'
    },
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://nothingness.asia/journal?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };
}

export function generateArticleSchema(article: {
  title: string;
  excerpt: string;
  slug: string;
  published_at: string;
  updated_at?: string;
  cover_image: string;
  author_name: string;
  author_role: string;
  category: string;
}) {
  const url = `https://nothingness.asia/journal/${article.slug}`;
  const imageUrl = article.cover_image.startsWith('http')
    ? article.cover_image
    : `https://nothingness.asia${article.cover_image}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    headline: article.title,
    description: article.excerpt,
    image: imageUrl,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    articleSection: article.category,
    inLanguage: 'en-IN',
    author: {
      '@type': 'Person',
      name: article.author_name,
      jobTitle: article.author_role,
      worksFor: {
        '@id': 'https://nothingness.asia/#organization'
      }
    },
    publisher: {
      '@id': 'https://nothingness.asia/#organization'
    }
  };
}

export function generateFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `https://nothingness.asia${item.url}`
    }))
  };
}
