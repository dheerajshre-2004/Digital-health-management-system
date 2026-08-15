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

async function testRealtime() {
  console.log('Subscribing to dhms_store changes...');
  
  const channel = supabase
    .channel('public:dhms_store')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dhms_store' }, payload => {
      console.log('Received real-time change:', payload);
    })
    .subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        // Trigger an update after subscription is active
        setTimeout(async () => {
          console.log('Triggering upsert for real-time test...');
          await supabase
            .from('dhms_store')
            .upsert({ key: 'dhms_realtime_test', value: { updated: true, ts: Date.now() } });
        }, 1000);
      }
    });

  // Keep process alive for a few seconds
  setTimeout(() => {
    console.log('Finished test, unsubscribing...');
    channel.unsubscribe();
    process.exit(0);
  }, 5000);
}

testRealtime();
