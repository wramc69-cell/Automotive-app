import { createClient } from '@supabase/supabase-js';

// We fall back to a dummy URL/Key if not provided in .env yet
// so the layout skeleton runs without breaking.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
