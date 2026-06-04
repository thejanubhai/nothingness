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
    name: 'Date Check',
    trigger_event: 'keyword',
    trigger_keyword: 'available',
    response_template: 'Hi {{guest_name}}! Please provide your preferred check-in and check-out dates, and I will check the availability for you.',
    channel: 'all',
    is_active: true
  },
  {
    name: 'Booking Process',
    trigger_event: 'keyword',
    trigger_keyword: 'book',
    response_template: 'Great! To proceed with your booking, please confirm the number of guests and any special requirements you might have.',
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
  },
  {
    name: 'Check-in Information',
    trigger_event: 'check_in',
    trigger_keyword: null,
    response_template: 'Welcome! Today is your check-in day at {{space_title}}. Check-in time starts at 2:00 PM. The property access code is 1234. Let us know if you need any assistance!',
    channel: 'all',
    is_active: true
  },
  {
    name: 'Check-out Information',
    trigger_event: 'check_out',
    trigger_keyword: null,
    response_template: 'Good morning! Today is your check-out day. Please remember that check-out time is 11:00 AM. We hope you had a wonderful stay!',
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
