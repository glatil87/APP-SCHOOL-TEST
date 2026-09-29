import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireEnv, supabasePublicKey, supabaseUrl } from "./env";

/** Supabase client acting as the signed-in parent (access rules apply). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    requireEnv(supabaseUrl(), "URL"),
    requireEnv(supabasePublicKey(), "public key"),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session instead.
          }
        },
      },
    },
  );
}
