import { NextRequest, NextResponse } from 'next/server';

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

    // Try fetching the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch Airbnb page' }, { status: 500 });
    }

    const html = await response.text();

    // Extract basic data using regex
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : '';

    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    const description = descMatch ? descMatch[1] : '';

    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    let imageUrl = imageMatch ? imageMatch[1] : '';
    if (imageUrl) {
      imageUrl = imageUrl.replace(/&amp;/g, '&');
    }

    // Extract bedrooms, bathrooms, and max guests dynamically from title & description
    let bedrooms = 1;
    let bathrooms = 1;
    let maxGuests = 2;

    const fullText = (title + ' ' + description).toLowerCase();

    if (fullText) {
      const bedMatch = fullText.match(/([0-9]+)\s+bedroom/i);
      if (bedMatch) bedrooms = parseInt(bedMatch[1], 10);
      
      const bathMatch = fullText.match(/([0-9]+(?:\.[0-9]+)?)\s+(?:private|shared)?\s*bath/i);
      if (bathMatch) bathrooms = parseFloat(bathMatch[1]);

      const guestMatch = fullText.match(/([0-9]+)\s+(?:guest|person|people)/i);
      if (guestMatch) maxGuests = parseInt(guestMatch[1], 10);
    }

    const iCalPlaceholder = `https://www.airbnb.com/calendar/ical/${listingId}.ics?s=YOUR_HASH_HERE`;

    return NextResponse.json({
      success: true,
      data: {
        title: title || `Airbnb Listing ${listingId}`,
        description,
        photos: imageUrl ? [imageUrl] : [],
        location: {
          city: '',
          area: '',
          state: '',
          country: ''
        },
        price_per_night: 0,
        max_guests: maxGuests,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        amenities: [],
        house_rules: [],
        airbnb_listing_id: listingId,
        airbnb_url: url,
        airbnb_ical_url: iCalPlaceholder,
        check_in_time: '3:00 PM',
        check_out_time: '11:00 AM',
        key_instructions: `Keys for ${title || 'this sanctuary'} are stored in the secure key lockbox at the main entrance. Please use key code 1234 to access your keys upon arrival.`,
        pre_arrival_template: `Hello {{guest_name}}! We are delighted to host you at {{space_title}}. Your check-in time starts at {{check_in_time}}. Key access: {{key_instructions}}.`,
        post_checkout_feedback_template: `Dear {{guest_name}}, thank you for staying at {{space_title}}! We hope you had a serene stay. Please share your private feedback with our management team to help us maintain high standards.`,
        cleaner_name: 'Housekeeping Supervisor',
        cleaner_phone: '',
      }
    });
  } catch (error: any) {
    console.error('Airbnb Scrape Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
