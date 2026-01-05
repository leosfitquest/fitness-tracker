import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Helper to check if Supabase is configured
const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined';

if (!isConfigured) {
  console.warn('⚠️ Supabase environment variables are missing! The app will run in offline/demo mode, but backend features will fail.');
}

// Export a safe client (or a mock if needed, but for now we try to create it and let it fail gracefully on requests)
// We provide fallback values to prevent the app from crashing on startup
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
)

