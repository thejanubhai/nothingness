const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Ars%23fah6%40161@[2406:da1a:82a:9d01:771a:3724:e96b:cb46]:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase DB');
    
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20260913000000_production_security_and_compliance_hardening.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    console.log('Successfully executed migration!');
    
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

main();
