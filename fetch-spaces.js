const { Client } = require('pg');
async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres.amlxlguebzkszkwkzroe:Ars%23fah6%40161@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query("SELECT id, title, slug, active, description, nightly_price, max_guests, amenities, rules FROM spaces");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
main();
