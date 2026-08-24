import { NextRequest, NextResponse } from 'next/server';

function cleanTitle(rawTitle: string, html: string, jsonLdName?: string): string {
  if (
    jsonLdName &&
    jsonLdName.trim() &&
    !jsonLdName.startsWith('Rental unit in') &&
    !jsonLdName.startsWith('Entire ') &&
    !jsonLdName.startsWith('Private room in') &&
    !jsonLdName.startsWith('Room in ')
  ) {
    return jsonLdName.trim();
  }

  // Try extracting from <title> tag
  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleTagMatch) {
    let t = titleTagMatch[1];
    // Strip suffixes like " - Flats for Rent in New Delhi, Delhi, India - Airbnb" or " - Airbnb"
    t = t.replace(/\s*[-–—]\s*(?:Flats|Apartments|Rental units|Houses|Villas|Rooms|Places to stay).*?-\s*Airbnb$/i, '');
    t = t.replace(/\s*[-–—]\s*Airbnb$/i, '');
    if (t.trim() && !t.includes('★') && !t.toLowerCase().startsWith('rental unit')) {
      return t.trim();
    }
  }

  // Check og:description if it contains listing name
  const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
  if (ogDescMatch && ogDescMatch[1].length < 80 && !ogDescMatch[1].toLowerCase().includes('bedroom')) {
    return ogDescMatch[1].trim();
  }

  if (rawTitle) {
    // If rawTitle contains bullet separators like "Rental unit in New Delhi · ★4.57 · 1 bedroom"
    if (rawTitle.includes(' · ')) {
      const parts = rawTitle.split(' · ');
      return parts[0];
    }
    return rawTitle;
  }

  return 'Sanctuary Listing';
}

function parseAirbnbHtml(html: string, url: string, listingId: string) {
  // 1. Parse JSON-LD blocks
  const jsonLdRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  let jsonLdData: any = null;

  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1]);
      if (
        parsed['@type'] === 'VacationRental' ||
        parsed['@type'] === 'HotelRoom' ||
        parsed['@type'] === 'Product' ||
        parsed['@type'] === 'LodgingBusiness' ||
        parsed['@type'] === 'Accommodation'
      ) {
        if (!jsonLdData || parsed['@type'] === 'VacationRental') {
          jsonLdData = parsed;
        }
      }
    } catch {
      // Ignore JSON parse errors in individual tags
    }
  }

  // 2. Parse deferred state
  let deferredData: any = null;
  const deferredMatch = html.match(/<script id="data-deferred-state-0"[^>]*>([\s\S]*?)<\/script>/i);
  if (deferredMatch) {
    try {
      deferredData = JSON.parse(deferredMatch[1]);
    } catch {
      // Ignore
    }
  }

  // Helper to walk objects
  function walk(obj: any, cb: (node: any) => void) {
    if (!obj || typeof obj !== 'object') return;
    cb(obj);
    if (Array.isArray(obj)) {
      for (const item of obj) walk(item, cb);
    } else {
      for (const key of Object.keys(obj)) walk(obj[key], cb);
    }
  }

  // 3. Extract Meta Tags as fallback
  const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
  const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);

  const rawOgTitle = ogTitleMatch ? ogTitleMatch[1] : '';
  const rawOgDesc = ogDescMatch ? ogDescMatch[1] : '';

  // Title
  const title = cleanTitle(rawOgTitle, html, jsonLdData?.name);

  // Description
  let description = jsonLdData?.description || rawOgDesc || '';
  if (!description && deferredData) {
    walk(deferredData, (node) => {
      if (node.__typename === 'PdpDescriptionSection' && node.htmlDescription?.htmlText) {
        description = node.htmlDescription.htmlText.replace(/<[^>]+>/g, '\n').trim();
      }
    });
  }

  // Photos
  const photoSet = new Set<string>();
  if (jsonLdData?.image) {
    const imgs = Array.isArray(jsonLdData.image) ? jsonLdData.image : [jsonLdData.image];
    imgs.forEach((img: any) => {
      if (typeof img === 'string' && !img.includes('AirbnbPlatformAssets') && !img.includes('/user/')) {
        photoSet.add(img.split('?')[0]);
      }
    });
  }

  if (deferredData) {
    walk(deferredData, (node) => {
      if (
        node.pictureUrl &&
        typeof node.pictureUrl === 'string' &&
        node.pictureUrl.includes('muscache') &&
        !node.pictureUrl.includes('AirbnbPlatformAssets') &&
        !node.pictureUrl.includes('/user/')
      ) {
        photoSet.add(node.pictureUrl.split('?')[0]);
      }
      if (
        node.largeUrl &&
        typeof node.largeUrl === 'string' &&
        node.largeUrl.includes('muscache') &&
        !node.largeUrl.includes('AirbnbPlatformAssets') &&
        !node.largeUrl.includes('/user/')
      ) {
        photoSet.add(node.largeUrl.split('?')[0]);
      }
      if (
        node.baseUrl &&
        typeof node.baseUrl === 'string' &&
        node.baseUrl.includes('muscache') &&
        !node.baseUrl.includes('AirbnbPlatformAssets') &&
        !node.baseUrl.includes('/user/')
      ) {
        photoSet.add(node.baseUrl.split('?')[0]);
      }
    });
  }

  // Regex fallback for muscache high-res listing images
  const muscacheRegex = /https:\/\/a0\.muscache\.com\/im\/pictures\/hosting\/Hosting-[0-9]+\/original\/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)/gi;
  let imgMatch;
  while ((imgMatch = muscacheRegex.exec(html)) !== null) {
    photoSet.add(imgMatch[0]);
  }

  if (ogImageMatch && photoSet.size === 0) {
    photoSet.add(ogImageMatch[1].replace(/&amp;/g, '&').split('?')[0]);
  }

  const photos = Array.from(photoSet);

  // Amenities
  const amenitySet = new Set<string>();
  if (deferredData) {
    walk(deferredData, (node) => {
      if (node.seeAllAmenitiesGroups) {
        node.seeAllAmenitiesGroups.forEach((g: any) => {
          if (g.amenities) {
            g.amenities.forEach((a: any) => {
              if (a.title && a.available !== false) {
                const t = a.title.trim();
                const lower = t.toLowerCase();
                if (
                  !lower.startsWith('check-in') &&
                  !lower.startsWith('checkout') &&
                  !lower.includes('guests maximum') &&
                  !lower.includes('alarm not reported') &&
                  !lower.includes('additional rules') &&
                  !lower.includes('holiday rentals')
                ) {
                  amenitySet.add(t);
                }
              }
            });
          }
        });
      }
      if (node.__typename === 'AmenityItem' && node.title) {
        amenitySet.add(node.title);
      }
    });
  }

  // House rules & check-in timings
  const rulesSet = new Set<string>();
  let checkInTime = '3:00 PM';
  let checkOutTime = '11:00 AM';

  if (deferredData) {
    walk(deferredData, (node) => {
      if (node.title && typeof node.title === 'string') {
        const lower = node.title.toLowerCase();
        if (lower.includes('check-in after') || lower.includes('check-in:')) {
          checkInTime = node.title.replace(/^check-in\s*(?:after|:)?\s*/i, '').trim();
        }
        if (lower.includes('checkout before') || lower.includes('check out:') || lower.includes('check-out before')) {
          checkOutTime = node.title.replace(/^check-?out\s*(?:before|:)?\s*/i, '').trim();
        }
        if (
          lower.includes('smoking') ||
          lower.includes('quiet hours') ||
          lower.includes('pet') ||
          lower.includes('part') ||
          lower.includes('guest') ||
          lower.includes('lock up') ||
          lower.includes('security camera')
        ) {
          if (!lower.includes('alarm not reported') && !lower.includes('holiday rentals') && !lower.includes('rentals in')) {
            rulesSet.add(node.title.trim());
          }
        }
      }
      if (node.subtitle && typeof node.subtitle === 'string') {
        const lower = node.subtitle.toLowerCase();
        if (
          (lower.includes('smoking') || lower.includes('pet') || lower.includes('quiet')) &&
          !lower.includes('holiday rentals')
        ) {
          rulesSet.add(node.subtitle.trim());
        }
      }
    });
  }

  // Location & Specs
  let city = jsonLdData?.address?.addressLocality || '';
  let state = jsonLdData?.address?.addressRegion || 'Delhi';
  let country = jsonLdData?.address?.addressCountry || 'India';
  let area = '';

  if (deferredData) {
    walk(deferredData, (node) => {
      if (node.localizedCityName && !city) city = node.localizedCityName;
      if (node.suburb && !area) area = node.suburb;
      if (node.neighborhood && !area) area = node.neighborhood;
    });
  }

  // Fallbacks for city & area
  if (!city) {
    if (html.includes('New Delhi')) city = 'New Delhi';
    else if (html.includes('Delhi')) city = 'Delhi';
    else if (html.includes('Goa')) city = 'Goa';
    else if (html.includes('Mumbai')) city = 'Mumbai';
  }

  if (!area) {
    if (html.includes('Hauz Khas')) area = 'Hauz Khas';
    else if (html.includes('South Delhi')) area = 'South Delhi';
    else if (html.includes('Saket')) area = 'Saket';
    else if (html.includes('Greater Kailash')) area = 'Greater Kailash';
    else if (html.includes('Vasant Kunj')) area = 'Vasant Kunj';
  }

  // Beds, baths, max guests
  let bedrooms = 1;
  let bathrooms = 1;
  let maxGuests = 2;

  const fullText = (title + ' ' + rawOgTitle + ' ' + description).toLowerCase();
  const bedMatch = fullText.match(/([0-9]+)\s+bedroom/i);
  if (bedMatch) bedrooms = parseInt(bedMatch[1], 10);

  const bathMatch = fullText.match(/([0-9]+(?:\.[0-9]+)?)\s+(?:private|shared)?\s*bath/i);
  if (bathMatch) bathrooms = parseFloat(bathMatch[1]);

  const guestMatch = fullText.match(/([0-9]+)\s+(?:guest|person|people)/i);
  if (guestMatch) maxGuests = parseInt(guestMatch[1], 10);

  // Nightly Price
  let price = 15000;
  const priceMatch = html.match(/₹\s*([0-9,]+)\s*(?:night|\/night)/i) || html.match(/"amount":\s*([0-9]+)/i);
  if (priceMatch) {
    const rawP = priceMatch[1].replace(/,/g, '');
    const parsedP = parseInt(rawP, 10);
    if (!isNaN(parsedP) && parsedP > 0 && parsedP < 500000) {
      price = parsedP;
    }
  }

  const iCalPlaceholder = `https://www.airbnb.com/calendar/ical/${listingId}.ics?s=YOUR_HASH_HERE`;

  return {
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    description,
    photos,
    location: {
      city: city || 'New Delhi',
      area: area || 'South Delhi',
      state: state || 'Delhi',
      country: country || 'India',
    },
    price_per_night: price,
    max_guests: maxGuests,
    bedrooms: bedrooms,
    bathrooms: bathrooms,
    amenities: Array.from(amenitySet),
    house_rules: Array.from(rulesSet),
    airbnb_listing_id: listingId,
    airbnb_url: url,
    airbnb_ical_url: iCalPlaceholder,
    check_in_time: checkInTime,
    check_out_time: checkOutTime,
    key_instructions: `Keys for ${title} are stored in the secure key lockbox at the main entrance. Please use key code 1234 to access your keys upon arrival.`,
    pre_arrival_template: `Hello {{guest_name}}! We are delighted to host you at {{space_title}}. Your check-in time starts at {{check_in_time}}. Key access: {{key_instructions}}.`,
    post_checkout_feedback_template: `Dear {{guest_name}}, thank you for staying at {{space_title}}! We hope you had a serene stay. Please share your private feedback with our management team to help us maintain high standards.`,
    cleaner_name: 'Housekeeping Supervisor',
    cleaner_phone: '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('airbnb.')) {
      return NextResponse.json({ success: false, error: 'Invalid Airbnb URL' }, { status: 400 });
    }

    // Extract listing ID
    const match = url.match(/rooms\/([0-9]+)/);
    const listingId = match ? match[1] : null;

    if (!listingId) {
      return NextResponse.json({ success: false, error: 'Could not extract listing ID from URL' }, { status: 400 });
    }

    // Fetch the Airbnb page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `Failed to fetch Airbnb page (Status ${response.status})` }, { status: 500 });
    }

    const html = await response.text();
    const data = parseAirbnbHtml(html, url, listingId);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Airbnb Scrape Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
