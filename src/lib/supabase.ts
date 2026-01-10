import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("[SUPABASE] Initializing client");
console.log("[SUPABASE] URL:", supabaseUrl);
console.log("[SUPABASE] Key loaded:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

if (!supabaseUrl.startsWith("https://")) {
  console.error("[SUPABASE] Invalid URL format:", supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    storageKey: 'sb-auth-token',
    detectSessionInUrl: true,
  },
});

console.log("[SUPABASE] Client initialized successfully");

// Test connectivity
export async function testSupabaseConnection() {
  try {
    console.log("[SUPABASE] Testing connection...");
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("[SUPABASE] Connection test failed:", error);
      return false;
    }
    console.log("[SUPABASE] Connection test passed");
    return true;
  } catch (error) {
    console.error("[SUPABASE] Connection test error:", error);
    return false;
  }
}

export type Database = any;
