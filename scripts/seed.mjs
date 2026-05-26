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

const properties = [
  {
    title: "The Chamber",
    slug: "the-chamber",
    city: "Unknown",
    area: "Secret Location",
    description: "An intense, sensual sanctuary bathed in deep red ambient light. The Chamber by Nothingness is designed for absolute intimacy and exploration. Featuring raw, dark walls, heavy chains, a St. Andrew's cross, and premium restraints, this space offers a cinematic, underground experience far removed from the ordinary world. The heavy ornate rugs and tungsten accents contrast with the intense fetish elements, creating an atmosphere of mysterious luxury.",
    nightly_price: 1500,
    cleaning_fee: 250,
    max_guests: 2,
    amenities: ["St. Andrew's Cross", "Premium Restraints", "Ambient Red Lighting", "Soundproofing", "Heavy Chains", "Custom Dark Furniture"],
    images: [
      "/images/the-chamber/image-1.jpg",
      "/images/the-chamber/image-2.jpg",
      "/images/the-chamber/image-3.jpg"
    ],
    featured_image: "/images/the-chamber/image-1.jpg",
    rules: "Absolute Discretion Required\nNo photography outside the space\nRespect the equipment",
    active: true,
    featured: true
  }
];

async function seed() {
  console.log("Seeding properties...");
  for (const prop of properties) {
    const { error } = await supabase.from('properties').upsert(prop, { onConflict: 'slug' });
    if (error) {
      console.error(`Failed to insert ${prop.title}:`, error);
    } else {
      console.log(`Successfully seeded ${prop.title}`);
    }
  }
  console.log("Seeding complete.");
}

seed();
