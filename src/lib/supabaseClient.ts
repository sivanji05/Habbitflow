import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Valid if URL looks like supabase URL and key is non-empty (supports both JWT and sb_publishable_ formats)
const isValidUrl = supabaseUrl.includes('supabase.co') || supabaseUrl.includes('supabase.in');
const isValidKey = supabaseAnonKey.length > 20;

export const isSupabaseConfigured = !!(isValidUrl && isValidKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[HabitFlow] Supabase keys missing or invalid.\n' +
    `URL: "${supabaseUrl}"\n` +
    `Key length: ${supabaseAnonKey.length}\n` +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env and restart dev server.'
  );
} else {
  console.log('[HabitFlow] Supabase configured ✅', supabaseUrl);
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
