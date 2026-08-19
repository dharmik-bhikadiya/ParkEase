import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ovpbxiviicjjzunrqema.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cGJ4aXZpaWNqanp1bnJxZW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNTU5NDEsImV4cCI6MjA1MzgzMTk0MX0.dummy_publishable_anon_key_for_client';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
