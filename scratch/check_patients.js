import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env manually
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPatients() {
  const { data, error } = await supabase
    .from('dhms_store')
    .select('key, value')
    .eq('key', 'dhms_patients')
    .single();

  if (error) {
    console.error('Error fetching patients:', error.message);
  } else {
    console.log('Patients list in Supabase:');
    console.log(JSON.stringify(data.value, null, 2));
  }
  process.exit(0);
}

checkPatients();
