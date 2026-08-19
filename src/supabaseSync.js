import { supabase } from './supabaseClient';

// Debounce map to avoid spamming the database with rapid state updates
const updateDebounceTimers = {};

/**
 * Pushes a key-value pair to the Supabase store
 * @param {string} key 
 * @param {string} value 
 */
async function pushToSupabase(key, value) {
  try {
    let parsedValue = value;
    try {
      parsedValue = JSON.parse(value);
    } catch (e) {
      // Keep as string if not JSON
    }

    const { error } = await supabase
      .from('dhms_store')
      .upsert({ key, value: parsedValue, updated_at: new Date().toISOString() });

    if (error) {
      console.error(`[Supabase Sync] Error syncing key "${key}":`, error.message);
    }
  } catch (err) {
    console.error(`[Supabase Sync] Exception syncing key "${key}":`, err);
  }
}

/**
 * Deletes a key from the Supabase store
 * @param {string} key 
 */
async function deleteFromSupabase(key) {
  try {
    const { error } = await supabase
      .from('dhms_store')
      .delete()
      .eq('key', key);

    if (error) {
      console.error(`[Supabase Sync] Error deleting key "${key}":`, error.message);
    }
  } catch (err) {
    console.error(`[Supabase Sync] Exception deleting key "${key}":`, err);
  }
}

/**
 * Initializes the real-time localStorage override/sync layer
 */
export function initSupabaseSync() {
  // Store the original localStorage methods
  const originalSetItem = window.localStorage.setItem;
  const originalRemoveItem = window.localStorage.removeItem;

  // Override setItem
  window.localStorage.setItem = function (key, value) {
    // Call original localStorage first so that sync state matches immediately
    originalSetItem.apply(this, arguments);

    // If it's a DHMS-specific key, sync it with Supabase in the background
    if (key.startsWith('dhms_')) {
      if (updateDebounceTimers[key]) {
        clearTimeout(updateDebounceTimers[key]);
      }
      updateDebounceTimers[key] = setTimeout(() => {
        pushToSupabase(key, value);
        delete updateDebounceTimers[key];
      }, 500); // 500ms debounce

      // Dispatch storage event locally so other components in the same tab update immediately
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Override removeItem
  window.localStorage.removeItem = function (key) {
    originalRemoveItem.apply(this, arguments);

    if (key.startsWith('dhms_')) {
      if (updateDebounceTimers[key]) {
        clearTimeout(updateDebounceTimers[key]);
        delete updateDebounceTimers[key];
      }
      deleteFromSupabase(key);

      // Dispatch storage event locally
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Subscribe to real-time changes from Supabase
  if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
    supabase
      .channel('public:dhms_store')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dhms_store' }, (payload) => {
        console.log('[Supabase Sync] Real-time event received:', payload);
        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const { key, value } = newRecord;
          if (key && key.startsWith('dhms_')) {
            const valStr = typeof value === 'object' ? JSON.stringify(value) : value;
            // Avoid redundant sets to prevent infinite loops
            if (window.localStorage.getItem(key) !== valStr) {
              originalSetItem.call(window.localStorage, key, valStr);
              window.dispatchEvent(new Event('storage'));
            }
          }
        } else if (eventType === 'DELETE') {
          const { key } = oldRecord;
          if (key && key.startsWith('dhms_')) {
            if (window.localStorage.getItem(key) !== null) {
              originalRemoveItem.call(window.localStorage, key);
              window.dispatchEvent(new Event('storage'));
            }
          }
        }
      })
      .subscribe((status) => {
        console.log('[Supabase Sync] Real-time channel status:', status);
      });
  }

  console.log('[Supabase Sync] Storage proxy active.');
}

/**
 * Fetches all keys from Supabase and populates localStorage on startup
 */
export async function fetchSupabaseData() {
  try {
    // Check if Supabase keys are configured first
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('[Supabase Sync] API keys missing. Running in local-only mode.');
      return;
    }

    // Clear local storage first to force a clean slate and avoid syncing old local data
    window.localStorage.clear();

    const { data, error } = await supabase
      .from('dhms_store')
      .select('key, value');

    if (error) {
      console.error('[Supabase Sync] Failed to load data from Supabase:', error.message);
      return;
    }

    if (data && data.length > 0) {
      const originalSetItem = window.localStorage.setItem;
      data.forEach(({ key, value }) => {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : value;
        // Use original setItem to avoid firing the update sync back to Supabase
        originalSetItem.call(window.localStorage, key, valStr);
      });
      console.log(`[Supabase Sync] Successfully loaded ${data.length} keys from Supabase.`);
    } else {
      console.log('[Supabase Sync] No remote records found. Seeding with defaults.');
    }
  } catch (err) {
    console.error('[Supabase Sync] Exception fetching initial data:', err);
  }
}
