import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const spaces = [
  {
    title: "The Chamber",
    slug: "the-chamber",
    city: "New Delhi",
    area: "South Delhi",
    description: "An intense, sensual sanctuary bathed in deep red ambient light. The Chamber by Nothingness is designed for absolute intimacy and exploration. Featuring raw, dark walls, heavy chains, a St. Andrew's cross, and premium restraints, this space offers a cinematic, underground experience far removed from the ordinary world.",
    nightly_price: 15000,
    cleaning_fee: 2500,
    max_guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["St. Andrew's Cross", "Premium Restraints", "Ambient Red Lighting", "Soundproofing", "Heavy Chains", "Custom Dark Furniture", "Keyless Check-In"],
    images: [
      "/images/IMG_9955.jpg",
      "/images/we heard your feedback (3).png",
      "/images/we heard your feedback (5).png",
      "/images/IMG_1593.jpg",
      "/images/IMG_1588.jpg",
      "/images/IMG_1854.jpeg"
    ],
    featured_image: "/images/IMG_9955.jpg",
    rules: "Absolute Discretion Required\nNo photography outside the space\nRespect the equipment",
    active: true
  },
  {
    title: "The Void",
    slug: "the-void",
    city: "New Delhi",
    area: "South Delhi",
    description: "A warm, high-design luxury sanctuary and private cinema lounge. Features tactile stucco finishes, Italian marble consoles, ambient perimeter lighting, and plush velvet seating.",
    nightly_price: 12000,
    cleaning_fee: 2000,
    max_guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["Private Cinema Lounge", "Backlit Vanity Mirror", "Velvet Armchairs", "Marble Console", "Ambient Perimeter Lighting", "High-Speed Wi-Fi"],
    images: [
      "/images/The Void.png",
      "/images/The Void (1).png",
      "/images/The Void (2).png",
      "/images/The Void (3).png",
      "/images/IMG_1854.jpeg"
    ],
    featured_image: "/images/The Void.png",
    rules: "Strictly 18+ Only\nNo smoking indoors\nKeyless digital lockbox access",
    active: true
  }
];

async function seed() {
  console.log("Seeding spaces...");
  for (const space of spaces) {
    const { error } = await supabase.from('spaces').upsert(space, { onConflict: 'slug' });
    if (error) {
      console.error(`Failed to insert ${space.title}:`, error);
    } else {
      console.log(`Successfully seeded ${space.title}`);
    }
  }
  console.log("Seeding complete.");
}

seed();
