import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "./supabase/admin";

/** Same hash the database stores (sha256 of the trimmed code, hex). */
export function hashInviteCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

/** A usable invite's school, or null if the code is wrong, revoked or expired. */
export async function findValidInvite(code: string): Promise<{ schoolId: string; schoolName: string } | null> {
  if (!/^[0-9a-f]{8,64}$/i.test(code)) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("invites")
    .select("school_id, expires_at, revoked_at, schools(name)")
    .eq("code_hash", hashInviteCode(code))
    .maybeSingle();
  if (!data || data.revoked_at || (data.expires_at && new Date(data.expires_at) <= new Date())) {
    return null;
  }
  const school = data.schools as unknown as { name: string } | null;
  return { schoolId: data.school_id, schoolName: school?.name ?? "your school" };
}
