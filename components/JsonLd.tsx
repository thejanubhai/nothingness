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

export function generateAccommodationSchema(space: {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  city?: string;
  area?: string;
  max_guests?: number;
  images: string[];
  amenities: string[];
}) {
  const url = `https://nothingness.asia/spaces/${space.slug}`;
  const images = space.images.map((img) =>
    img.startsWith('http') ? img : `https://nothingness.asia${img}`
  );

  return {
    '@context': 'https://schema.org',
    '@type': ['HotelRoom', 'Accommodation'],
    '@id': `${url}#accommodation`,
    name: space.title,
    description: space.description,
    url,
    image: images,
    occupancy: {
      '@type': 'QuantitativeValue',
      maxValue: space.max_guests || 4,
      minValue: 1,
      unitText: 'Guests',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: space.area || space.city || 'New Delhi',
      addressRegion: space.city || 'Delhi NCR',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '28.6139',
      longitude: '77.2090',
    },
    amenityFeature: space.amenities.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true,
    })),
    offers: {
      '@type': 'Offer',
      price: space.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url,
      validFrom: new Date().toISOString().split('T')[0],
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: space.price,
        priceCurrency: 'INR',
        unitCode: 'DAY',
      },
    },
    containedInPlace: {
      '@type': 'LodgingBusiness',
      name: 'Nothingness Sanctuaries',
      url: 'https://nothingness.asia',
      '@id': 'https://nothingness.asia/#organization',
    },
  };
}

export function generateSpaceListSchema(spaces: {
  title: string;
  slug: string;
  location?: string;
  price?: number;
  image?: string;
}[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Nothingness Private Sanctuaries & Suites',
    description: 'Curated architectural sanctuaries and intimate suites for total isolation and discretion in Delhi NCR.',
    url: 'https://nothingness.asia/spaces',
    numberOfItems: spaces.length,
    itemListElement: spaces.map((space, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'HotelRoom',
        name: space.title,
        url: `https://nothingness.asia/spaces/${space.slug}`,
        image: space.image
          ? space.image.startsWith('http')
            ? space.image
            : `https://nothingness.asia${space.image}`
          : 'https://nothingness.asia/images/IMG_9955.jpg',
        offers: space.price
          ? {
              '@type': 'Offer',
              price: space.price,
              priceCurrency: 'INR',
            }
          : undefined,
      },
    })),
  };
}

export function generateSanctuaryPassSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': 'https://nothingness.asia/sanctuary-pass#pass',
    name: 'Nothingness Sanctuary Pass',
    description: 'Exclusive lifetime pass to confidential discussion salons, midnight noir masquerades, and curated intimate soirées across Delhi NCR. Governed by concierge vetting and strict discretion.',
    brand: {
      '@type': 'Brand',
      name: 'Nothingness',
      '@id': 'https://nothingness.asia/#organization',
    },
    image: 'https://nothingness.asia/images/IMG_9955.jpg',
    url: 'https://nothingness.asia/sanctuary-pass',
    offers: {
      '@type': 'Offer',
      price: '1499',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: 'https://nothingness.asia/sanctuary-pass',
      category: 'Hospitality & Events Membership',
    },
  };
}

export function generateTheCircleSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    '@id': 'https://nothingness.asia/the-circle#circle',
    headline: 'The Circle • 18+ Private Monikers & Desires',
    description: 'An intimate, confidential society reserved exclusively for verified guests of Nothingness. Connect under complete anonymity with private @aliases, explore deep aesthetic chemistry, and unlock private sanctuary suites.',
    url: 'https://nothingness.asia/the-circle',
    publisher: {
      '@id': 'https://nothingness.asia/#organization',
    },
  };
}
