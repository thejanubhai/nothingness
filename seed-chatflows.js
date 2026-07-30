const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    envVars[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultFlows = [
  {
    name: 'Date & Availability Check',
    trigger_event: 'keyword',
    trigger_keyword: 'available',
    response_template: 'Hi {{guest_name}}! Please provide your preferred check-in and check-out dates, and I will check live availability for you.',
    channel: 'all',
    is_active: true
  },
  {
    name: 'Booking Process',
    trigger_event: 'keyword',
    trigger_keyword: 'book',
    response_template: 'Great! To proceed with your booking, please confirm the number of guests and your preferred sanctuary dates.',
    channel: 'all',
    is_active: true
  },
  {
    name: 'Check-in & Check-out Timings',
    trigger_event: 'keyword',
    trigger_keyword: 'checkin',
    response_template: 'Standard check-in time starts at 3:00 PM and check-out is by 11:00 AM. Early check-in or late check-out can be requested via our concierge.',
    channel: 'all',
    is_active: true
  },
  {
    name: 'AC & Climate Control',
    trigger_event: 'keyword',
    trigger_keyword: 'ac',
    response_template: 'All our luxury sanctuaries and chambers feature climate-controlled Air Conditioning (AC) with individual room thermostats for maximum guest comfort.',
    channel: 'all',
    is_active: true
  },
  {
    name: 'Amenities & Tools',
    trigger_event: 'keyword',
    trigger_keyword: 'amenities',
    response_template: 'Our sanctuaries offer premium amenities including high-speed Wi-Fi, fully equipped gourmet kitchen tools, climate-controlled AC, luxury linens, private pool access, and 24/7 concierge support.',
    channel: 'all',
    is_active: true
  },
  {
    name: 'ID Verification Required',
    trigger_event: 'booking_confirmed',
    trigger_keyword: null,
    response_template: 'Your booking is confirmed! As per our policy, please upload a valid government ID (Aadhaar or Passport) to verify your identity before check-in.',
    channel: 'all',
    is_active: true
  },
  {
    name: 'Booking Confirmation Details',
    trigger_event: 'booking_confirmed',
    trigger_keyword: null,
    response_template: 'Thank you for booking with us, {{guest_name}}! Your stay at {{space_title}} from {{check_in_date}} to {{check_out_date}} is confirmed.',
    channel: 'all',
    is_active: true
  }
];

async function seed() {
  for (const flow of defaultFlows) {
    const { data: existing } = await supabase
      .from('chatflows')
      .select('id')
      .eq('name', flow.name)
      .single();
      
    if (!existing) {
      const { error } = await supabase.from('chatflows').insert([flow]);
      if (error) {
        console.error(`Error inserting ${flow.name}:`, error.message);
      } else {
        console.log(`Inserted default flow: ${flow.name}`);
      }
    } else {
      console.log(`Flow already exists: ${flow.name}`);
    }
  }
  console.log("Seeding complete.");
}

seed();
