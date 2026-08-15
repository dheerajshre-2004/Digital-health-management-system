import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env values manually since it's a simple script
const envContent = fs.readFileSync(path.resolve('.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const url = env['VITE_SUPABASE_URL'];
const anonKey = env['VITE_SUPABASE_ANON_KEY'];

if (!url || !anonKey) {
  console.error('Error: Could not find VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env file.');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function clearDatabase() {
  console.log('Connecting to Supabase at:', url);
  console.log('Clearing all records from table "dhms_store"...');
  
  const { data, error } = await supabase
    .from('dhms_store')
    .delete()
    .neq('key', ''); // Delete all rows where key is not empty

  if (error) {
    console.error('Error clearing database:', error.message);
  } else {
    console.log('Database successfully cleared! All records removed.');
  }
}

clearDatabase();
