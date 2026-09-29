import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv, supabaseSecretKey, supabaseUrl } from "./env";

/**
 * Supabase client that bypasses the access rules. Server-only, and only used
 * after the caller's permission has been checked (invite code, first-time
 * setup, or coordinator role).
 */
export function createAdminClient() {
  return createClient(
    requireEnv(supabaseUrl(), "URL"),
    requireEnv(supabaseSecretKey(), "secret key"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
