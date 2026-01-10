import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("[SUPABASE] Initializing client");
console.log("[SUPABASE] URL:", supabaseUrl);
console.log("[SUPABASE] Key loaded:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[SUPABASE] ERROR: Missing environment variables");
  console.error("[SUPABASE] VITE_SUPABASE_URL:", supabaseUrl ? "✓" : "✗ Missing");
  console.error("[SUPABASE] VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓" : "✗ Missing");
  throw new Error(
    `Missing Supabase environment variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`
  );
}

if (!supabaseUrl.startsWith("https://")) {
  console.error("[SUPABASE] Invalid URL format:", supabaseUrl);
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    storageKey: 'sb-auth-token',
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "X-Client-Info": "supabase-js/web",
    },
  },
});

console.log("[SUPABASE] Client initialized successfully");
console.log("[SUPABASE] Base URL:", supabaseUrl);

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
